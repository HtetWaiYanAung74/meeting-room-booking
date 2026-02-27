import { Request } from "express";

export type UserRole = 'admin' | 'owner' | 'user';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    created_at: string;
}

export interface Booking {
    id: string;
    user_id: string;
    title: string;
    start_time: string;
    end_time: string;
    created_at: string;
}

export interface BookingWithUser extends Booking {
    name: string;
    role: UserRole;
}

// Request types
export interface AuthenticatedRequest extends Request {
    user?: User;
}

// API request bodies
export interface LoginRequestBody {
    name: string;
    password: string;
}

export interface CreateUserRequestBody {
    name: string;
    password: string;
    role: UserRole;
}

export interface UpdateRoleRequestBody {
    role: UserRole;
}

export interface CreateBookingRequestBody {
    title: string;
    startTime: string;
    endTime: string;
}

export interface UserAuthRow extends User {
  password_hash: string;
}

// API response types
export interface ApiError {
    error: string;
    message: string;
    role?: UserRole;
    conflictingBookings?: ConflitingBooking[];
}

export interface ConflitingBooking {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
}

export interface LoginResponse {
    message: string;
    user: Omit<User, 'created_at'>;
}

export interface UserResponse {
    user: User | User[];
}

export interface UsersResponse {
    users: User[];
}

export interface BookingResponse {
    message: string;
    booking: BookingWithUser;
}

export interface BookingsResponse {
    bookings: BookingWithUser[];
}

export interface BookingsByUserGroup {
    user: {
        id: string;
        name: string;
        role: UserRole;
    };
    bookings: Omit<Booking, 'user_id'>[];
}

export interface BookingsByUserResponse {
    bookingsByUser: BookingsByUserGroup[];
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
    }
}

export interface SummaryTotals {
    totalUsers: number;
    totalBookings: number;
    totalMinutes: number;
}

export interface SummaryResponse {
    summary: UserStats[];
    totals: SummaryTotals;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export interface UserCountByRoleRow {
    role: UserRole;
    count: number;
}

export interface BookingSummaryRow {
    id: string;
    name: string;
    role: UserRole;
    booking_count: number;
    total_minutes: number | null;
}

export interface OverlapCheckRow {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
}