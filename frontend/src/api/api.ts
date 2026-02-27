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
const REQUEST_TIMEOUT = 15000;

class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

class ApiClient {
    private userId: string | null = null;

    setUserId(userId: string | null): void {
        this.userId = userId;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        if (this.userId) {
            headers['x-user-id'] = this.userId;
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...config,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (!response.ok) {
                    throw new ApiError(
                        `Server error: ${response.status} ${response.statusText}`,
                        response.status,
                        'SERVER_ERROR'
                    );
                }
                throw new ApiError('Server returned non-JSON response', response.status, 'INVALID_RESPONSE');   
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Request failed');
            }
            return data as T;
            
        } catch(error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiError('Request timed out. Please check your internet connection.', 0, 'TIMEOUT');
            }

            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new ApiError('Network error. Please check your internet connection', 0, 'NETWORK_ERROR');
            }

            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError(
                error instanceof Error ? error.message : 'An unexpected error occurred',
                0,
                'UNKNOWN_ERROR'
            );
        }
    }

    // Auth
    async login(name: string, password: string): Promise<LoginResponse> {
        return this.request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ name, password }),
        });
    }

    // Users
    async getUsers(): Promise<UsersResponse> {
        return this.request<UsersResponse>('/users');
    }

    async createUser(name: string, password: string, role: UserRole): Promise<UserResponse> {
        return this.request<UserResponse>('/users', {
            method: 'POST',
            body: JSON.stringify({ name, password, role }),
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