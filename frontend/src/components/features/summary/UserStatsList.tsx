import { RoleBadge } from '@/components/common';
import type { UserStats } from '@/types';
import { pluralize } from '@/utils';

interface UserStatsListProps {
    stats: UserStats[];
}

export function UserStatsList({ stats }: UserStatsListProps) {
    return (
        <div className="flex flex-col gap-sm">
            {stats.map((item) => (
                <div key={item.user.id} className="list-item">
                    <div className="list-item__content flex items-center gap-sm">
                        <span className="font-medium">{item.user.name}</span>
                        <RoleBadge role={item.user.role} />
                    </div>
                    <div className="flex gap-lg text-sm text-gray-600">
                        <span>
                            <strong>{item.stats.totalBookings}</strong> {pluralize(item.stats.totalBookings, 'booking')}
                        </span>
                        <span>
                            <strong>{item.stats.totalHours}</strong> {pluralize(item.stats.totalHours, 'hour')}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}