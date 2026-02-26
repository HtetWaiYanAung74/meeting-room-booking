import { useState, useCallback, useEffect } from 'react';
import { api } from '@/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addNotification } from '@/store/slices';
import type { SummaryData, BookingsByUserGroup } from '@/types';

export function useSummary() {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [bookingsByUser, setBookingsByUser] = useState<BookingsByUserGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSummary = useCallback(async () => {
        if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
            return;
        }

        setIsLoading(true);
        try {
            const [summaryResponse, bookingsResponse] = await Promise.all([
                api.getBookingSummary(),
                api.getBookingsByUser(),
            ]);
            setSummary(summaryResponse);
            setBookingsByUser(bookingsResponse.bookingsByUser);
        } catch (error) {
            dispatch(
                addNotification({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to fetch summary',
                })
            );
        } finally {
            setIsLoading(false);
        }
    }, [user, dispatch]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return {
        summary,
        bookingsByUser,
        isLoading,
        fetchSummary,
    };
}