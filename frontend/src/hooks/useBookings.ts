import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchBookings,
    createBooking as createBookingAction,
    deleteBooking as deleteBookingAction,
    clearBookingsError,
} from '@/store/slices';
import { addNotification } from '@/store/slices';

export function useBookings() {
    const dispatch = useAppDispatch();
    const { items: bookings, isLoading, error } = useAppSelector((state) => state.bookings);
    const { user } = useAppSelector((state) => state.auth);

    // Fetch bookings from API when user is authenticated
    useEffect(() => {
        if (user) {
            dispatch(fetchBookings());
        }
    }, [user, dispatch]);

    const handleFetchBookings = useCallback(() => {
        return dispatch(fetchBookings());
    }, [dispatch]);

    const handleCreateBooking = useCallback(
        async (title: string, startTime: string, endTime: string) => {
            const result = await dispatch(createBookingAction({ title, startTime, endTime }));
            if (createBookingAction.fulfilled.match(result)) {
                dispatch(addNotification({ type: 'success', message: 'Booking created successfully!' }));
                return result.payload;
            } else {
                dispatch(addNotification({ type: 'error', message: result.payload as string }));
                throw new Error(result.payload as string);
            }
        },
        [dispatch]
    );

    const handleDeleteBooking = useCallback(
        async (bookingId: string) => {
            const result = await dispatch(deleteBookingAction(bookingId));
            if (deleteBookingAction.fulfilled.match(result)) {
                dispatch(addNotification({ type: 'success', message: 'Booking deleted successfully!' }));
            } else {
                dispatch(addNotification({ type: 'error', message: result.payload as string }));
                throw new Error(result.payload as string);
            }
        },
        [dispatch]
    );

    const handleClearError = useCallback(() => {
        dispatch(clearBookingsError());
    }, [dispatch]);

    return {
        bookings,
        isLoading,
        error,
        fetchBookings: handleFetchBookings,
        createBooking: handleCreateBooking,
        deleteBooking: handleDeleteBooking,
        clearError: handleClearError,
    };
}