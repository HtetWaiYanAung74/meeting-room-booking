import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Notification, MessageType } from '@/types';

interface NotificationState {
    items: Notification[];
}

const initialState: NotificationState = {
    items: [],
};

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (
            state,
            action: PayloadAction<{ type: MessageType; message: string }>
        ) => {
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            state.items.push({
                id,
                type: action.payload.type,
                message: action.payload.message,
            });
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter((n) => n.id !== action.payload);
        },
        clearAllNotifications: (state) => {
            state.items = [];
        },
    },
});

export const { addNotification, removeNotification, clearAllNotifications } =
    notificationSlice.actions;
export default notificationSlice.reducer;