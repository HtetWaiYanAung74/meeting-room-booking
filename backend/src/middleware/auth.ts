import { Response, NextFunction, Request } from 'express';
import { userQueries } from '../db/database.js';
import { User, UserRole, ApiError } from '../types/index.js';

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId || typeof userId !== 'string') {
            const error: ApiError = {
                error: 'Authentication required',
                message: 'Missing x-user-id header',
            };
            res.status(401).json(error);
            return;
        }

        const user = await userQueries.getById(userId);

        if (!user) {
            const error: ApiError = {
                error: 'Authentication failed',
                message: 'User not found',
            };
            res.status(401).json(error);
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Server error', message: 'Authentication failed' });
    }
}

export function authorize(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            const error: ApiError = {
                error: 'Authentication required',
                message: 'User not authenticated',
            };
            res.status(401).json(error);
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            const error: ApiError = {
                error: 'Access denied',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
                role: req.user.role,
            };
            res.status(403).json(error);
            return;
        }
        next();
    };
}