import { Button, RoleBadge } from '@/components/common';
import { useAuth } from '@/hooks';

export function Header() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <header className="header">
            <h1 className="header__title">Meeting Room Booking System</h1>
            <div className="header__user">
                <span className="header__name">{user.name}</span>
                <RoleBadge role={user.role} />
                <Button variant="secondary" size="sm" onClick={logout}>
                    Logout
                </Button>
            </div>
        </header>
    );
}