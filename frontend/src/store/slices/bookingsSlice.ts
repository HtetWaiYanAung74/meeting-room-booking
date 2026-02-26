import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/api/api';
import type { Booking } from '@/types';

interface BookingsState {
    items: Booking[];
    isLoading: boolean;
    error: string | null;
}

const initialState: BookingsState = {
    items: [],
    isLoading: false,
    error: null,
};

export const fetchBookings = createAsyncThunk(
    'bookings/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.getBookings();
            return response.bookings;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch bookings');
        }
    }
);

export const createBooking = createAsyncThunk(
    'bookings/create',
    async (
        { title, startTime, endTime }: { title: string; startTime: string; endTime: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await api.createBooking(title, startTime, endTime);
            return response.booking;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to create booking');
        }
    }
);

export const deleteBooking = createAsyncThunk(
    'bookings/delete',
    async (bookingId: string, { rejectWithValue }) => {
        try {
            await api.deleteBooking(bookingId);
            return bookingId;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete booking');
        }
    }
);

const sortBookings = (bookings: Booking[]): Booking[] => {
    return [...bookings].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
};

const bookingsSlice = createSlice({
    name: 'bookings',
    initialState,
    reducers: {
        clearBookingsError: (state) => {
            state.error = null;
        },
        clearAllBookings: (state) => {
            state.items = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBookings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBookings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = sortBookings(action.payload);
            })
            .addCase(fetchBookings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(createBooking.pending, (state) => {
                state.error = null;
            })
            .addCase(createBooking.fulfilled, (state, action) => {
                state.items = sortBookings([...state.items, action.payload]);
            })
            .addCase(createBooking.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            .addCase(deleteBooking.pending, (state) => {
                state.error = null;
            })
            .addCase(deleteBooking.fulfilled, (state, action) => {
                state.items = state.items.filter((b) => b.id !== action.payload);
            })
            .addCase(deleteBooking.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearBookingsError, clearAllBookings } = bookingsSlice.actions;
export default bookingsSlice.reducer;