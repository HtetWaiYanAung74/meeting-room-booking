import type { ReactNode } from 'react';
import type { UserRole } from '@/types';

interface BadgeProps {
    variant?: UserRole | 'success' | 'error';
    children: ReactNode;
    className?: string;
}

export function Badge({ variant = 'user', children, className = '' }: BadgeProps) {
    const classes = ['badge', `badge--${variant}`, className].filter(Boolean).join(' ');

    return <span className={classes}>{children}</span>;
}

interface RoleBadgeProps {
    role: UserRole;
    className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
    return (
        <Badge variant={role} className={className}>
            {role}
        </Badge>
    );
}