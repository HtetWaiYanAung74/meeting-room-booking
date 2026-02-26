import { PageSection } from '@/components/layout';
import { Loader, Button } from '@/components/common';
import { BookingForm, BookingList } from '@/components/features/bookings';
import { useBookings, useAuth } from '@/hooks';
import { LoaderCircle, RefreshCw } from 'lucide-react';

export function BookingsPage() {
    const { user } = useAuth();
    const { bookings, isLoading, createBooking, deleteBooking, fetchBookings } = useBookings();

    const handleCreateBooking = async (title: string, startTime: string, endTime: string) => {
        try {
            await createBooking(title, startTime, endTime);
        } catch {
            // Error handled in hook
        }
    };

    const handleDeleteBooking = async (bookingId: string) => {
        try {
            await deleteBooking(bookingId);
        } catch {
            // Error handled in hook
        }
    };

    const handleRefresh = () => {
        fetchBookings();
    };

    if (!user) return null;

    return (
        <>
            <PageSection title="Create New Booking">
                <div className='login-page'>
                    <BookingForm onSubmit={handleCreateBooking} />
                </div>
            </PageSection>

            <PageSection title="All Bookings">
                <div className="flex justify-between items-center mb-md">
                    <span className="text-sm text-gray-500">
                        {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                        {isLoading ? <LoaderCircle size={16} /> : <RefreshCw size={16} />}
                    </Button>
                </div>
                {isLoading && bookings.length === 0 ? (
                    <Loader text="Loading bookings..." />
                ) : (
                    <BookingList bookings={bookings} currentUser={user} onDelete={handleDeleteBooking} />
                )}
            </PageSection>
        </>
    );
}