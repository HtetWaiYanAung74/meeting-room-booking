import { useCallback, useEffect } from 'react';
import { api } from '@/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, logout, clearAuthError, resetAuthLoading } from '@/store/slices';
import { addNotification } from '@/store/slices';

export function useAuth() {
    const dispatch = useAppDispatch();
    const { user, isLoading, error } = useAppSelector((state) => state.auth);

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';
    const isOwnerOrAdmin = user?.role === 'admin' || user?.role === 'owner';

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) {
                dispatch(resetAuthLoading());
            }
        }, 100);
      return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (user) {
            api.setUserId(user.id);
        }
    }, [user]);

    const handleLogin = useCallback(
        async (name: string, password: string) => {
            try {
                const result = await dispatch(loginUser({name, password}));
                if (loginUser.rejected.match(result)) {
                    dispatch(addNotification({ type: 'error', message: result.payload as string }));
                    throw new Error(result.payload as string);
                }
            } catch (error) {
                dispatch(resetAuthLoading());
                throw error;
            }
        },
        [dispatch]
    );

    const handleLogout = useCallback(() => {
        dispatch(logout());
    }, [dispatch]);

    const handleClearError = useCallback(() => {
        dispatch(clearAuthError());
    }, [dispatch]);

    const handleResetLoading = useCallback(() => {
        dispatch(resetAuthLoading());
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
        resetLoading: handleResetLoading,
    };
}