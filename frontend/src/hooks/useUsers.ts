import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchUsers,
    createUser as createUserAction,
    updateUserRole as updateUserRoleAction,
    deleteUser as deleteUserAction,
    clearUsersError,
} from '@/store/slices';
import { addNotification } from '@/store/slices';
import type { UserRole } from '@/types';

export function useUsers() {
    const dispatch = useAppDispatch();
    const { items: users, isLoading, error, lastFetched } = useAppSelector((state) => state.users);
    const { user } = useAppSelector((state) => state.auth);

    // Fetch users when user is admin and haven't fetched recently
    useEffect(() => {
        if (user?.role === 'admin') {
            const shouldFetch = !lastFetched || Date.now() - lastFetched > 30000;
            if (shouldFetch) {
                dispatch(fetchUsers());
            }
        }
    }, [user, lastFetched, dispatch]);

    const handleFetchUsers = useCallback(() => {
        return dispatch(fetchUsers());
    }, [dispatch]);

    const handleCreateUser = useCallback(
        async (name: string, role: UserRole) => {
            const result = await dispatch(createUserAction({ name, role }));
            if (createUserAction.fulfilled.match(result)) {
                dispatch(addNotification({ type: 'success', message: 'User created successfully!' }));
                return result.payload;
            } else {
                dispatch(addNotification({ type: 'error', message: result.payload as string }));
                throw new Error(result.payload as string);
            }
        },
        [dispatch]
    );

    const handleUpdateUserRole = useCallback(
        async (userId: string, role: UserRole) => {
            const result = await dispatch(updateUserRoleAction({ userId, role }));
            if (updateUserRoleAction.fulfilled.match(result)) {
                dispatch(addNotification({ type: 'success', message: 'Role updated successfully!' }));
                return result.payload;
            } else {
                dispatch(addNotification({ type: 'error', message: result.payload as string }));
                throw new Error(result.payload as string);
            }
        },
        [dispatch]
    );

    const handleDeleteUser = useCallback(
        async (userId: string) => {
            const result = await dispatch(deleteUserAction(userId));
            if (deleteUserAction.fulfilled.match(result)) {
                dispatch(addNotification({ type: 'success', message: 'User deleted successfully!' }));
            } else {
                dispatch(addNotification({ type: 'error', message: result.payload as string }));
                throw new Error(result.payload as string);
            }
        },
        [dispatch]
    );

    const handleClearError = useCallback(() => {
        dispatch(clearUsersError());
    }, [dispatch]);

    return {
        users,
        isLoading,
        error,
        fetchUsers: handleFetchUsers,
        createUser: handleCreateUser,
        updateUserRole: handleUpdateUserRole,
        deleteUser: handleDeleteUser,
        clearError: handleClearError,
    };
}