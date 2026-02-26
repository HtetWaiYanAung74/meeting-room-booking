import { RoleBadge, EmptyState } from '@/components/common';
import { formatShortDateTime, pluralize } from '@/utils/formatters';
import type { BookingsByUserGroup } from '@/types';

interface BookingsByUserProps {
    groups: BookingsByUserGroup[];
}

export function BookingsByUser({ groups }: BookingsByUserProps) {
    if (groups.length === 0) {
        return <EmptyState icon="📋" title="No bookings found" />;
    }

    return (
        <div className="flex flex-col gap-lg">
            {groups.map((group) => (
                <div key={group.user.id}>
                    <h4 className="flex items-center gap-sm mb-sm">
                        <span className="font-medium">{group.user.name}</span>
                        <RoleBadge role={group.user.role} />
                        <span className="text-gray-500 font-normal">
                            ({group.bookings.length} {pluralize(group.bookings.length, 'booking')})
                        </span>
                    </h4>
                    <div className="flex flex-col gap-sm">
                        {group.bookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="list-item"
                                style={{ borderLeftColor: 'var(--color-success-500)' }}
                            >
                                <div className="list-item__content">
                                    <h3 className="list-item__title">{booking.title}</h3>
                                    <p className="list-item__subtitle">
                                        {formatShortDateTime(booking.start_time)} —{' '}
                                        {formatShortDateTime(booking.end_time)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}