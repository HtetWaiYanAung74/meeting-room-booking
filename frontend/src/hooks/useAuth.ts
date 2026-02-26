import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, logout, clearAuthError } from '@/store/slices';
import { addNotification } from '@/store/slices';

export function useAuth() {
    const dispatch = useAppDispatch();
    const { user, isLoading, error } = useAppSelector((state) => state.auth);

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';
    const isOwnerOrAdmin = user?.role === 'admin' || user?.role === 'owner';

    const handleLogin = useCallback(
        async (name: string) => {
            const result = await dispatch(loginUser(name));
            if (loginUser.rejected.match(result)) {
                dispatch(addNotification({ type: 'error', message: result.payload as string }));
                throw new Error(result.payload as string);
            }
        },
        [dispatch]
    );

    const handleLogout = useCallback(() => {
        dispatch(logout());
        // Note: We do NOT clear bookings on logout
    }, [dispatch]);

    const handleClearError = useCallback(() => {
        dispatch(clearAuthError());
    }, [dispatch]);

    return {
        user,
        isAuthenticated,
        isAdmin,
        isOwnerOrAdmin,
        isLoading,
        error,
        login: handleLogin,
        logout: handleLogout,
        clearError: handleClearError,
    };
}