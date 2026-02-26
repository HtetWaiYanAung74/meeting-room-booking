import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { userQueries } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequiredFields, validateRole, isValidRole } from '../utils/validation.js';
import type {
    CreateUserRequestBody,
    UpdateRoleRequestBody,
    UsersResponse,
    UserResponse,
    ApiError,
} from '../types/index.js';

const router = Router();

// GET /api/users - List all users (Admin only)
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
            res.status(500).json({ error: 'Database error', message: 'Failed to fetch users' });
        }
    }
);

// POST /api/users - Create user (Admin only)
router.post(
    '/',
    authenticate,
    authorize('admin'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, role } = req.body as CreateUserRequestBody;

            // Validate fields
            const fieldValidation = validateRequiredFields({ name, role }, ['name', 'role']);
            if (!fieldValidation.valid) {
                res.status(400).json({ error: 'Validation error', message: fieldValidation.error });
                return;
            }

            // Validate role
            const roleValidation = validateRole(role);
            if (!roleValidation.valid) {
                res.status(400).json({ error: 'Validation error', message: roleValidation.error });
                return;
            }

            // Check if name exists
            const existingUser = await userQueries.getByName(name.trim());
            if (existingUser) {
                res.status(409).json({ error: 'Conflict', message: 'Username already exists' });
                return;
            }

            // Create user
            const id = uuidv4();
            if (isValidRole(role)) {
                const newUser = await userQueries.create(id, name.trim(), role);
                res.status(201).json({ message: 'User created successfully', user: newUser });
            }
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Database error', message: 'Failed to create user' });
        }
    }
);

// PATCH /api/users/:id/role - Update user role (Admin only)
router.patch(
    '/:id/role',
    authenticate,
    authorize('admin'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { role } = req.body as UpdateRoleRequestBody;

            // Validate role
            const roleValidation = validateRole(role);
            if (!roleValidation.valid) {
                res.status(400).json({ error: 'Validation error', message: roleValidation.error });
                return;
            }

            // Check if user exists
            const user = await userQueries.getById(id);
            if (!user) {
                res.status(404).json({ error: 'Not found', message: 'User not found' });
                return;
            }

            // Prevent self-role change
            if (req.user && id === req.user.id) {
                res.status(400).json({ error: 'Invalid operation', message: 'Cannot change your own role' });
                return;
            }

            // Update role
            if (isValidRole(role)) {
                const updatedUser = await userQueries.updateRole(id, role);
                res.json({ message: 'Role updated successfully', user: updatedUser });
            }
        } catch (error) {
            console.error('Update role error:', error);
            res.status(500).json({ error: 'Database error', message: 'Failed to update role' });
        }
    }
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            // Check if user exists
            const user = await userQueries.getById(id);
            if (!user) {
                res.status(404).json({ error: 'Not found', message: 'User not found' });
                return;
            }

            // Prevent self-deletion
            if (req.user && id === req.user.id) {
                res.status(400).json({ error: 'Invalid operation', message: 'Cannot delete your own account' });
                return;
            }

            // Delete user (bookings cascade)
            await userQueries.delete(id);
            res.json({
                message: 'User deleted successfully',
                note: 'All bookings by this user have been deleted',
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Database error', message: 'Failed to delete user' });
        }
    }
);

export default router;