import { Card, CardBody, Message } from '@/components/common';
import { LoginForm, QuickLoginButtons } from '@/components/features/auth';
import { useAuth, useNotifications } from '@/hooks';

export function LoginPage() {
    const { login, isLoading } = useAuth();
    const { notifications } = useNotifications();

    return (
        <div className="login-page-wrapper">
            <div className="login-page">
                <div className="login-brand">
                    <h1 className="login-brand__title">Meeting Room</h1>
                    <p className="login-brand__subtitle">Booking System</p>
                </div>

                <Card className="login-card">
                    <CardBody>
                        <h2 className="login-card__title">Welcome Back</h2>
                        <p className="login-card__description">Sign in to manage your bookings</p>

                        {notifications.map((n) => (
                            <Message key={n.id} type={n.type}>
                                {n.message}
                            </Message>
                        ))}

                        <LoginForm onSubmit={login} isLoading={isLoading} />

                        <div className="login-divider">
                            <span>or continue with demo account</span>
                        </div>

                        <QuickLoginButtons onSelect={login} isLoading={isLoading} />
                    </CardBody>
                </Card>

                <p className="login-footer">Manage your meeting room bookings efficiently</p>
            </div>
        </div>
    );
}