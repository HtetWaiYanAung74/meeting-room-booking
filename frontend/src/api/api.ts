import type {
    LoginResponse,
    UserResponse,
    UsersResponse,
    BookingsResponse,
    BookingResponse,
    BookingsByUserResponse,
    SummaryResponse,
    DeleteResponse,
    UserRole,
} from '@/types';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

class ApiClient {
    private userId: string | null = null;

    setUserId(userId: string | null): void {
        this.userId = userId;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.userId) {
            (headers as Record<string, string>)['x-user-id'] = this.userId;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Request failed');
        }

        return data as T;
    }

    // Auth
    async login(name: string): Promise<LoginResponse> {
        return this.request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    // Users
    async getUsers(): Promise<UsersResponse> {
        return this.request<UsersResponse>('/users');
    }

    async createUser(name: string, role: UserRole): Promise<UserResponse> {
        return this.request<UserResponse>('/users', {
            method: 'POST',
            body: JSON.stringify({ name, role }),
        });
    }

    async updateUserRole(userId: string, role: UserRole): Promise<UserResponse> {
        return this.request<UserResponse>(`/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
    }

    async deleteUser(userId: string): Promise<DeleteResponse> {
        return this.request<DeleteResponse>(`/users/${userId}`, {
            method: 'DELETE',
        });
    }

    // Bookings
    async getBookings(): Promise<BookingsResponse> {
        return this.request<BookingsResponse>('/bookings');
    }

    async getBookingsByUser(): Promise<BookingsByUserResponse> {
        return this.request<BookingsByUserResponse>('/bookings/by-user');
    }

    async getBookingSummary(): Promise<SummaryResponse> {
        return this.request<SummaryResponse>('/bookings/summary');
    }

    async createBooking(title: string, startTime: string, endTime: string): Promise<BookingResponse> {
        return this.request<BookingResponse>('/bookings', {
            method: 'POST',
            body: JSON.stringify({ title, startTime, endTime }),
        });
    }

    async deleteBooking(bookingId: string): Promise<DeleteResponse> {
        return this.request<DeleteResponse>(`/bookings/${bookingId}`, {
            method: 'DELETE',
        });
    }
}

export const api = new ApiClient();