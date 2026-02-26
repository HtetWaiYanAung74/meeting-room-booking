import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { authReducer, bookingsReducer, usersReducer, notificationReducer } from './slices';

const rootReducer = combineReducers({
    auth: authReducer,
    bookings: bookingsReducer,
    users: usersReducer,
    notifications: notificationReducer,
});

// Only persist auth - bookings and users come from API
const persistConfig = {
    key: 'meeting-room-app',
    version: 1,
    storage,
    whitelist: ['auth'], // Only persist auth state
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;