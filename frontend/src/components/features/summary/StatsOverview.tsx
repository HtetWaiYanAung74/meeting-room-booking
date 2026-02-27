import type { SummaryTotals } from '@/types';

interface StatsOverviewProps {
    totals: SummaryTotals;
}

export function StatsOverview({ totals }: StatsOverviewProps) {
    const stats = [
        { label: 'Total Users', value: totals.totalUsers },
        { label: 'Total Bookings', value: totals.totalBookings },
        { label: 'Total Hours Booked', value: Math.round(((totals.totalMinutes || 0) / 60) * 100) / 100 },
    ];

    return (
        <div className="stats-grid">
            {stats.map((stat) => (
                <div key={stat.label} className="stat-card">
                    <div className="stat-card__value">{stat.value}</div>
                    <div className="stat-card__label">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}