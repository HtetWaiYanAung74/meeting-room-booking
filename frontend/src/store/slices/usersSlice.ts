import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/api/api';
import type { User, UserRole } from '@/types';

interface UsersState {
    items: User[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
}

const initialState: UsersState = {
    items: [],
    isLoading: false,
    error: null,
    lastFetched: null,
};

export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const response = await api.getUsers();
        return response.users;
    } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch users');
    }
});

export const createUser = createAsyncThunk(
    'users/create',
    async ({ name, role }: { name: string; role: UserRole }, { rejectWithValue }) => {
        try {
            const response = await api.createUser(name, role);
            return response.user;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to create user');
        }
    }
);

export const updateUserRole = createAsyncThunk(
    'users/updateRole',
    async ({ userId, role }: { userId: string; role: UserRole }, { rejectWithValue }) => {
        try {
            const response = await api.updateUserRole(userId, role);
            return response.user;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to update role');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'users/delete',
    async (userId: string, { rejectWithValue }) => {
        try {
            await api.deleteUser(userId);
            return userId;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete user');
        }
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearUsersError: (state) => {
            state.error = null;
        },
        clearAllUsers: (state) => {
            state.items = [];
            state.lastFetched = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch users
            .addCase(fetchUsers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Create user
            .addCase(createUser.pending, (state) => {
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            .addCase(createUser.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            // Update user role
            .addCase(updateUserRole.pending, (state) => {
                state.error = null;
            })
            .addCase(updateUserRole.fulfilled, (state, action) => {
                const index = state.items.findIndex((u) => u.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(updateUserRole.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            // Delete user
            .addCase(deleteUser.pending, (state) => {
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.items = state.items.filter((u) => u.id !== action.payload);
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearUsersError, clearAllUsers } = usersSlice.actions;
export default usersSlice.reducer;