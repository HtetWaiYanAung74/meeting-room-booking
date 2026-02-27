import { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '@/hooks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resetAuthLoading } from '@/store/slices';
import { api } from '@/api/api';
import { Header, Tabs, PageContainer } from '@/components/layout';
import { Message } from '@/components/common';
import { LoginPage, BookingsPage, UsersPage, SummaryPage } from '@/pages';
import { TABS } from '@/utils/constants';

function App() {
    const dispatch = useAppDispatch();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { notifications, removeNotification } = useNotifications();
    const [activeTab, setActiveTab] = useState('bookings');

    const persistedUser = useAppSelector((state) => state.auth.user);

    useEffect(() => {
        dispatch(resetAuthLoading());
        if (persistedUser) {
            api.setUserId(persistedUser.id);
        }
    }, [dispatch, persistedUser]);

    useEffect(() => {
        if (authLoading) {
            const timeout = setTimeout(() => {
                console.warn('Auth loading stuck, resetting ...');
                dispatch(resetAuthLoading());
            }, 30000);
            return () => clearTimeout(timeout);
        }
    }, [authLoading, dispatch]);

    if (!isAuthenticated || !user) {
        return <LoginPage />;
    }

    const renderPage = () => {
        switch (activeTab) {
            case 'bookings':
                return <BookingsPage />;
            case 'summary':
                return <SummaryPage />;
            case 'users':
                return <UsersPage />;
            default:
                return <BookingsPage />;
        }
    };

    return (
        <div className="container">
            <Header />
            <Tabs tabs={TABS} activeTab={activeTab} userRole={user.role} onTabChange={setActiveTab} />

            <PageContainer>
                {notifications.map((n) => (
                    <Message key={n.id} type={n.type} onDismiss={() => removeNotification(n.id)}>
                        {n.message}
                    </Message>
                ))}
                {renderPage()}
            </PageContainer>
        </div>
    );
}

export default App;