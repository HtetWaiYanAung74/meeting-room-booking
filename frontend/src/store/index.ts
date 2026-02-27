import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    createTransform,
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
    PersistConfig,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { authReducer, bookingsReducer, usersReducer, notificationReducer } from './slices';

const resetLoadingTransform = createTransform(
    (inboundState: any) => inboundState,
    (outboundState: any, key) => {
        if (key === 'auth' || key === 'bookings' || key === 'users') {
            return {
                ...outboundState,
                isLoading: false,
                error: null,
            };
        }
        return outboundState;
    }
)

const rootReducer = combineReducers({
    auth: authReducer,
    bookings: bookingsReducer,
    users: usersReducer,
    notifications: notificationReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Only persist auth - bookings and users come from API
const persistConfig: PersistConfig<RootState> = {
    key: 'meeting-room-app',
    version: 1,
    storage,
    whitelist: ['auth'], // Only persist auth state
    transforms: [resetLoadingTransform], // Apply transform
};

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
        devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;