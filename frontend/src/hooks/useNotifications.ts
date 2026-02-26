import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addNotification, removeNotification, clearAllNotifications } from '@/store/slices';
import type { MessageType } from '@/types';
import { NOTIFICATION_DURATION } from '@/utils/constants';

export function useNotifications() {
    const dispatch = useAppDispatch();
    const { items: notifications } = useAppSelector((state) => state.notifications);
    const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Auto-remove notifications after duration
    useEffect(() => {
        notifications.forEach((notification) => {
            if (!timeoutRefs.current.has(notification.id)) {
                const timeout = setTimeout(() => {
                    dispatch(removeNotification(notification.id));
                    timeoutRefs.current.delete(notification.id);
                }, NOTIFICATION_DURATION);
                timeoutRefs.current.set(notification.id, timeout);
            }
        });

        // Cleanup timeouts for removed notifications
        timeoutRefs.current.forEach((timeout, id) => {
            if (!notifications.find((n) => n.id === id)) {
                clearTimeout(timeout);
                timeoutRefs.current.delete(id);
            }
        });
    }, [notifications, dispatch]);

    // Cleanup all timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
            timeoutRefs.current.clear();
        };
    }, []);

    const showNotification = useCallback(
        (type: MessageType, message: string) => {
            dispatch(addNotification({ type, message }));
        },
        [dispatch]
    );

    const showSuccess = useCallback(
        (message: string) => {
            dispatch(addNotification({ type: 'success', message }));
        },
        [dispatch]
    );

    const showError = useCallback(
        (message: string) => {
            dispatch(addNotification({ type: 'error', message }));
        },
        [dispatch]
    );

    const handleRemoveNotification = useCallback(
        (id: string) => {
            dispatch(removeNotification(id));
        },
        [dispatch]
    );

    const handleClearAll = useCallback(() => {
        dispatch(clearAllNotifications());
    }, [dispatch]);

    return {
        notifications,
        showNotification,
        showSuccess,
        showError,
        removeNotification: handleRemoveNotification,
        clearAll: handleClearAll,
    };
}