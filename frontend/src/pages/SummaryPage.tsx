import { useState } from 'react';
import { Button, Loader, Card, CardBody } from '@/components/common';
import { StatsOverview, UserStatsList, BookingsByUser } from '@/components/features/summary';
import { useSummary } from '@/hooks';

type ViewType = 'stats' | 'byUser';

export function SummaryPage() {
    const { summary, bookingsByUser, isLoading } = useSummary();
    const [activeView, setActiveView] = useState<ViewType>('stats');

    if (isLoading) {
        return <Loader text="Loading summary..." />;
    }

    if (!summary) {
        return <p>Failed to load summary data.</p>;
    }

    return (
        <>
            <div className="flex gap-sm mb-lg">
                <Button
                    variant={activeView === 'stats' ? 'primary' : 'secondary'}
                    onClick={() => setActiveView('stats')}
                >
                    Usage Statistics
                </Button>
                <Button
                    variant={activeView === 'byUser' ? 'primary' : 'secondary'}
                    onClick={() => setActiveView('byUser')}
                >
                    Bookings by User
                </Button>
            </div>

            <Card>
                <CardBody>
                    {activeView === 'stats' && (
                        <>
                            <h3 className="text-lg font-semibold mb-md">Overall Statistics</h3>
                            <StatsOverview totals={summary.totals} />

                            <h3 className="text-lg font-semibold mt-lg mb-md">Per User Statistics</h3>
                            <UserStatsList stats={summary.summary} />
                        </>
                    )}

                    {activeView === 'byUser' && (
                        <>
                            <h3 className="text-lg font-semibold mb-md">Bookings Grouped by User</h3>
                            <BookingsByUser groups={bookingsByUser} />
                        </>
                    )}
                </CardBody>
            </Card>
        </>
    );
}