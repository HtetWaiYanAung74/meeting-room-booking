import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { userQueries } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequiredFields, validateRole, isValidRole } from '../utils/validation.js';
import {
    CreateUserRequestBody,
    UpdateRoleRequestBody,
    UsersResponse,
    UserResponse,
    ApiError,
} from '../types/index.js';

const router = Router();

router.get(
    '/',
    authenticate,
    authorize('admin'),
    async (_req: Request, res: Response): Promise<void> => {
        try {
            const users = await userQueries.getAll();
            const response: UsersResponse = { users };
            res.json(response);
        } catch (error) {
            console.error('Get users error:', error);
            const apiError: ApiError = {
                error: 'Database error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(apiError);
        }
    }
);

router.post(
    '/',
    authenticate,
    authorize('admin'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, role } = req.body as CreateUserRequestBody;

            const fieldValidation = validateRequiredFields({ name, role }, ['name', 'role']);
            if (!fieldValidation.valid) {
                const error: ApiError = {
                    error: 'Validation error',
                    message: fieldValidation.error!,
                };
                res.status(400).json(error);
                return;
            }

            const roleValidation = validateRole(role);
            if (!roleValidation.valid) {
                const error: ApiError = {
                    error: 'Validation error',
                    message: roleValidation.error!,
                };
                res.status(400).json(error);
                return;
            }

            const existingUser = await userQueries.getByUsername(name.trim().toLowerCase());
            if (existingUser) {
                const error: ApiError = {
                    error: 'Conflict',
                    message: 'Username already exists',
                };
                res.status(409).json(error);
                return;
            }

            const id = uuidv4();
            if (isValidRole(role)) {
                await userQueries.create(id, name.trim().toLowerCase(), role);
            }

            const newUser = await userQueries.getById(id);
            if (!newUser) {
                throw new Error('Failed to create user');
            }

            const response: UserResponse & { message: string } = {
                message: 'User created successfully',
                user: newUser,
            };
            res.status(201).json(response);
        } catch (error) {
            console.error('Create user error:', error);
            const apiError: ApiError = {
                error: 'Database error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(apiError);
        }
    }
);

router.patch(
    '/:id/role',
    authenticate,
    authorize('admin'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                const error: ApiError = {
                    error: 'Authentication required',
                    message: 'User not found in request',
                };
                res.status(401).json(error);
                return;
            }

            const { id } = req.params;
            const { role } = req.body as UpdateRoleRequestBody;

            const roleValidation = validateRole(role);
            if (!roleValidation.valid) {
                const error: ApiError = {
                    error: 'Validation error',
                    message: roleValidation.error!,
                };
                res.status(400).json(error);
                return;
            }

            const user = await userQueries.getById(id);
            if (!user) {
                const error: ApiError = {
                    error: 'Not found',
                    message: 'User not found',
                };
                res.status(404).json(error);
                return;
            }

            if (id === req.user.id) {
                const error: ApiError = {
                    error: 'Invalid operation',
                    message: 'Cannot change your own role',
                };
                res.status(400).json(error);
                return;
            }

            if (isValidRole(role)) {
                await userQueries.updateRole(id, role);
            }

            const updatedUser = await userQueries.getById(id);
            if (!updatedUser) {
                throw new Error('Failed to update user');
            }

            const response: UserResponse & { message: string } = {
                message: 'Role updated successfully',
                user: updatedUser,
            };
            res.json(response);
        } catch (error) {
            console.error('Update role error:', error);
            const apiError: ApiError = {
                error: 'Database error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(apiError);
        }
    }
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                const error: ApiError = {
                    error: 'Authentication required',
                    message: 'User not found in request',
                };
                res.status(401).json(error);
                return;
            }

            const { id } = req.params;

            const user = await userQueries.getById(id);
            if (!user) {
                const error: ApiError = {
                    error: 'Not found',
                    message: 'User not found',
                };
                res.status(404).json(error);
                return;
            }

            if (id === req.user.id) {
                const error: ApiError = {
                    error: 'Invalid operation',
                    message: 'Cannot delete your own account',
                };
                res.status(400).json(error);
                return;
            }

            const rowCount = await userQueries.delete(id);

            if (rowCount === 0) {
                const error: ApiError = {
                    error: 'Not found',
                    message: 'User not found',
                };
                res.status(404).json(error);
                return;
            }

            res.json({
                message: 'User deleted successfully',
                note: 'All bookings associated with this user have also been deleted',
            });
        } catch (error) {
            console.error('Delete user error:', error);
            const apiError: ApiError = {
                error: 'Database error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(apiError);
        }
    }
);

export default router;