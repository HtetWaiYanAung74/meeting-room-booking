import { TabItem, UserRole } from '@/types';

export const ROLES: UserRole[] = ['admin', 'owner', 'user'];

export const ROLE_OPTIONS = [
    { value: 'user', label: 'User' },
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
] as const;

export const DEMO_USERS = [
    { name: 'admin', role: 'admin' as UserRole },
    { name: 'owner', role: 'owner' as UserRole },
    { name: 'user1', role: 'user' as UserRole },
    { name: 'user2', role: 'user' as UserRole },
];

export const TABS: TabItem[] = [
    { id: 'bookings', label: 'Bookings' },
    { id: 'summary', label: 'Summary', roles: ['owner', 'admin'] },
    { id: 'users', label: 'User Management', roles: ['admin'] },
];

export const NOTIFICATION_DURATION = 5000;