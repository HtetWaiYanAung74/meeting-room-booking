import { EmptyState } from '@/components/common';
import { BookingItem } from './BookingItem';
import type { Booking, User } from '@/types';

interface BookingListProps {
    bookings: Booking[];
    currentUser: User;
    onDelete: (bookingId: string) => Promise<void>;
}

export function BookingList({ bookings, currentUser, onDelete }: BookingListProps) {
    if (bookings.length === 0) {
        return (
            <EmptyState icon="📅" title="No bookings yet" description="Create your first booking above!" />
        );
    }

    return (
        <div className="flex flex-col gap-sm">
            {bookings.map((booking) => (
                <BookingItem
                    key={booking.id}
                    booking={booking}
                    currentUser={currentUser}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}