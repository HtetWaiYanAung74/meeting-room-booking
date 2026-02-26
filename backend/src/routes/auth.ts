import { Router, Request, Response } from 'express';
import { userQueries } from '../db/database.js';
import type { LoginRequestBody, LoginResponse, UserResponse, ApiError } from '../types/index.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body as LoginRequestBody;

        if (!name?.trim()) {
            const error: ApiError = { error: 'Validation error', message: 'Username is required' };
            res.status(400).json(error);
            return;
        }

        const user = await userQueries.getByName(name.trim());

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
            user: { id: user.id, name: user.name, role: user.role },
        };
        res.json(response);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error', message: 'Login failed' });
    }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId || typeof userId !== 'string') {
            const error: ApiError = { error: 'Not authenticated', message: 'Missing x-user-id header' };
            res.status(401).json(error);
            return;
        }

        const user = await userQueries.getById(userId);

        if (!user) {
            const error: ApiError = { error: 'User not found', message: 'User does not exist' };
            res.status(404).json(error);
            return;
        }

        const response: UserResponse = { user };
        res.json(response);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error', message: 'Failed to get user' });
    }
});

export default router;