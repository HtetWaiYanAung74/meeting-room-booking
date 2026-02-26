import { NextFunction, Response } from "express";
import { ApiError, AuthenticatedRequest, UserRole } from "../types/index.js";
import { userQueries } from "../db/database.js";

export function authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const userId = req.headers['x-user-id'] as string | undefined;
    if (!userId) {
        const error: ApiError = {
            error: "Authentication required",
            message: "Missing x-user-id header",
        };
        res.status(401).json(error);
        return;
    }

    const user = userQueries.getById(userId);
    if (!user) {
        const error: ApiError = {
            error: "Authentication failed",
            message: "User not found",
        };
        res.status(401).json(error);
        return;
    }
    req.user = user;
    next();
}

/**
 * Authorization middleware
 * @param allowedRoles - Roles allowed to access the route
 */
export function authorize(...allowedRoles: UserRole[]) {
    return (
        req: AuthenticatedRequest, 
        res: Response, 
        next: NextFunction
    ): void => {
        const user = req.user;
        if (!user) {
            const error: ApiError = {
                error: "Authorization required",
                message: "User not authenticated",
            };
            res.status(401).json(error);
            return;
        }

        if (!allowedRoles.includes(user.role)) {
            const error: ApiError = {
                error: "Access denied",
                message: "This action requires one of the following roles: " + allowedRoles.join(", "),
                role: user.role,
            };
            res.status(403).json(error);
            return;
        }
        next();
    };
}
