import { useState } from 'react';
import { Button, RoleBadge } from '@/components/common';
import { formatDateTime } from '@/utils/formatters';
import type { Booking, User } from '@/types';

interface BookingItemProps {
  booking: Booking;
  currentUser: User;
  onDelete: (bookingId: string) => Promise<void>;
}

export function BookingItem({ booking, currentUser, onDelete }: BookingItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete =
    currentUser.role === 'admin' ||
    currentUser.role === 'owner' ||
    booking.user_id === currentUser.id;

  const isOwnBooking = booking.user_id === currentUser.id;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    setIsDeleting(true);
    try {
      await onDelete(booking.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="list-item">
      <div className="list-item__content">
        <h3 className="list-item__title">{booking.title}</h3>
        <p className="list-item__subtitle">
          {formatDateTime(booking.start_time)} — {formatDateTime(booking.end_time)}
        </p>
        <p className="list-item__subtitle mt-sm">
          Booked by: <strong>{booking.name}</strong>
          <RoleBadge role={booking.role} className="ml-sm" />
          {isOwnBooking && <span className="text-primary ml-sm font-medium">(You)</span>}
        </p>
      </div>
      {canDelete && (
        <div className="list-item__actions">
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}