import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { userQueries } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequiredFields, validateRole, isValidRole } from '../utils/validation.js';
import {
    AuthenticatedRequest,
    CreateUserRequestBody,
    UpdateRoleRequestBody,
    UsersResponse,
    UserResponse,
    ApiError,
} from '../types/index.js';

const router = Router();

/**
 * GET /api/v1/users
 * List all users (Admin only)
 */
router.get(
    '/',
    authenticate,
    authorize('admin'),
    (_req: AuthenticatedRequest, res: Response): void => {
        try {
            const users = userQueries.getAll();
            const response: UsersResponse = { users };
            res.json(response);
        } catch (error) {
            const apiError: ApiError = {
                error: 'Database error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(apiError);
        }
    }
);

/**
 * POST /api/v1/users
 * Create a new user (Admin only)
 */
router.post(
    '/',
    authenticate,
    authorize('admin'),
    (req: AuthenticatedRequest, res: Response): void => {
        const { name, role } = req.body as CreateUserRequestBody;

        // Validate required fields
        const fieldValidation = validateRequiredFields({ name, role }, ['name', 'role']);
        if (!fieldValidation.valid) {
            const error: ApiError = {
                error: 'Validation error',
                message: fieldValidation.error!,
            };
            res.status(400).json(error);
            return;
        }

        // Validate role
        const roleValidation = validateRole(role);
        if (!roleValidation.valid) {
            const error: ApiError = {
                error: 'Validation error',
                message: roleValidation.error!,
            };
            res.status(400).json(error);
            return;
        }

        // Check if name already exists
        const existingUser = userQueries.getByName(name.trim().toLowerCase());
        if (existingUser) {
            const error: ApiError = {
                error: 'Conflict',
                message: 'Name already exists',
            };
            res.status(409).json(error);
            return;
        }

        try {
            const id = uuidv4();
            if (isValidRole(role)) {
                userQueries.create(id, name.trim().toLowerCase(), role);
            }

            const newUser = userQueries.getById(id);
            if (!newUser) {
                throw new Error('Failed to create user');
            }

            const response: UserResponse & { message: string } = {
                message: 'User created successfully',
                user: newUser,
            };
            res.status(201).json(response);
        } catch (error) {
            const apiError: ApiError = {
                error: 'Database error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(apiError);
        }
    }
);

/**
 * PATCH /api/v1/users/:id/role
 * Change user role (Admin only)
 */
router.patch(
    '/:id/role',
    authenticate,
    authorize('admin'),
    (req: AuthenticatedRequest, res: Response): void => {
        const { id } = req.params;
        const { role } = req.body as UpdateRoleRequestBody;

        // Validate role
        const roleValidation = validateRole(role);
        if (!roleValidation.valid) {
            const error: ApiError = {
                error: 'Validation error',
                message: roleValidation.error!,
            };
            res.status(400).json(error);
            return;
        }

        // Check if user exists
        const user = userQueries.getById(id);
        if (!user) {
            const error: ApiError = {
                error: 'Not found',
                message: 'User not found',
            };
            res.status(404).json(error);
            return;
        }

        // Prevent admin from changing their own role
        if (id === req.user?.id?.toString()) {
            const error: ApiError = {
                error: 'Invalid operation',
                message: 'Cannot change your own role',
            };
            res.status(400).json(error);
            return;
        }

        try {
            if (isValidRole(role)) {
                userQueries.updateRole(id, role);
            }

            const updatedUser = userQueries.getById(id);
            if (!updatedUser) {
                throw new Error('Failed to update user');
            }

            const response: UserResponse & { message: string } = {
                message: 'Role updated successfully',
                user: updatedUser,
            };
            res.json(response);
        } catch (error) {
            const apiError: ApiError = {
                error: 'Database error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(apiError);
        }
    }
);

/**
 * DELETE /api/v1/users/:id
 * Delete a user (Admin only)
 */
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    (req: AuthenticatedRequest, res: Response): void => {
        const { id } = req.params;

        // Check if user exists
        const user = userQueries.getById(id);
        if (!user) {
            const error: ApiError = {
                error: 'Not found',
                message: 'User not found',
            };
            res.status(404).json(error);
            return;
        }

        // Prevent admin from deleting themselves
        if (id === req.user?.id?.toString()) {
            const error: ApiError = {
                error: 'Invalid operation',
                message: 'Cannot delete your own account',
            };
            res.status(400).json(error);
            return;
        }

        try {
            const result = userQueries.delete(id);

            if (result.changes === 0) {
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
            const apiError: ApiError = {
                error: 'Database error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(apiError);
        }
    }
);

export default router;