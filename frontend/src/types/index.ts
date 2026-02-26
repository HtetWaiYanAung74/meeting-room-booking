export type UserRole = 'admin' | 'owner' | 'user';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    created_at?: string;
}

export interface Booking {
    id: string;
    user_id: string;
    title: string;
    start_time: string;
    end_time: string;
    created_at: string;
    name: string;
    role: UserRole;
}

export interface BookingFormData {
    title: string;
    startTime: string;
    endTime: string;
}

export interface UserStats {
    user: {
        id: string;
        name: string;
        role: UserRole;
    };
    stats: {
        totalBookings: number;
        totalMinutes: number;
        totalHours: number;
    };
}

export interface SummaryTotals {
    totalUsers: number;
    totalBookings: number;
    totalMinutes: number;
}

export interface SummaryData {
    summary: UserStats[];
    totals: SummaryTotals;
}

export interface BookingsByUserGroup {
    user: {
        id: string;
        name: string;
        role: UserRole;
    };
    bookings: Array<{
        id: string;
        title: string;
        start_time: string;
        end_time: string;
        created_at: string;
    }>;
}

export interface LoginResponse {
    message: string;
    user: Omit<User, 'created_at'>;
}

export interface UserResponse {
    user: User;
    message?: string;
}

export interface UsersResponse {
    users: User[];
}

export interface BookingsResponse {
    bookings: Booking[];
}

export interface BookingResponse {
    message: string;
    booking: Booking;
}

export interface BookingsByUserResponse {
    bookingsByUser: BookingsByUserGroup[];
}

export interface SummaryResponse {
    summary: UserStats[];
    totals: SummaryTotals;
}

export interface DeleteResponse {
    message: string;
    note?: string;
}

export interface ApiError {
    error: string;
    message: string;
}

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface TabItem {
    id: string;
    label: string;
    roles?: UserRole[];
}

export interface Notification {
    id: string;
    type: MessageType;
    message: string;
}