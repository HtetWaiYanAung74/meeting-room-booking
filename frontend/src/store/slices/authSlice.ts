import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/api/api';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    isLoading: false,
    error: null,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (name: string, { rejectWithValue }) => {
        try {
            const response = await api.login(name);
            const user = response.user as User;
            api.setUserId(user.id);
            return user;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.error = null;
            state.isLoading = false;
            api.setUserId(null);
        },
        clearAuthError: (state) => {
            state.error = null;
        },
        setAuthUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isLoading = false;
            api.setUserId(action.payload.id);
        },
        resetAuthLoading: state => {
            state.isLoading = false;
        },
        resetAuthState: () => initialState,
    },
    extraReducers: builder => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { 
    clearAuthError, 
    logout, 
    resetAuthLoading, 
    resetAuthState, 
    setAuthUser, 
} = authSlice.actions;
export default authSlice.reducer;