import { Router, Response } from 'express';
import { userQueries } from '../db/database.js';
import {
    AuthenticatedRequest,
    LoginRequestBody,
    LoginResponse,
    UserResponse,
    ApiError,
} from '../types/index.js';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Simple login by name
 */
router.post('/login', (req: AuthenticatedRequest, res: Response): void => {
    const { name } = req.body as LoginRequestBody;

    if (!name || !name.trim()) {
        const error: ApiError = {
            error: 'Validation error',
            message: 'Username is required',
        };
        res.status(400).json(error);
        return;
    }

    const user = userQueries.getByName(name.trim().toLowerCase());

    if (!user) {
        const error: ApiError = {
            error: 'User not found',
            message: `No user found with name: ${name}`,
        };
        res.status(404).json(error);
        return;
    }

    const response: LoginResponse = {
        message: 'Login successful',
        user: {
            id: user.id,
            name: user.name,
            role: user.role,
        },
    };

    res.json(response);
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get('/me', (req: AuthenticatedRequest, res: Response): void => {
    const userId = req.headers['x-user-id'] as string | undefined;

    if (!userId) {
        const error: ApiError = {
            error: 'Not authenticated',
            message: 'Missing x-user-id header',
        };
        res.status(401).json(error);
        return;
    }

    const user = userQueries.getById(userId);

    if (!user) {
        const error: ApiError = {
            error: 'User not found',
            message: 'User does not exist',
        };
        res.status(404).json(error);
        return;
    }

    const response: UserResponse = { user };
    res.json(response);
});

export default router;