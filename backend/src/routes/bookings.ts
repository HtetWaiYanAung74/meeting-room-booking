import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { bookingQueries } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBookingTimes, validateRequiredFields } from '../utils/validation.js';
import type {
    CreateBookingRequestBody,
    BookingsResponse,
    BookingResponse,
    BookingsByUserResponse,
    BookingsByUserGroup,
    SummaryResponse,
    UserStats,
    ApiError,
} from '../types/index.js';

const router = Router();

// GET /api/v1/bookings - List all bookings
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
    try {
        const bookings = await bookingQueries.getAll();
        const response: BookingsResponse = { bookings };
        res.json(response);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Database error', message: 'Failed to fetch bookings' });
    }
});

// GET /api/v1/bookings/by-user - Bookings grouped by user (Owner/Admin)
router.get(
    '/by-user',
    authenticate,
    authorize('owner', 'admin'),
    async (_req: Request, res: Response): Promise<void> => {
        try {
            const bookings = await bookingQueries.getGroupedByUser();

            // Group by user
            const groupedMap = new Map<string, BookingsByUserGroup>();

            for (const booking of bookings) {
                if (!groupedMap.has(booking.user_id)) {
                    groupedMap.set(booking.user_id, {
                        user: {
                            id: booking.user_id,
                            name: booking.name,
                            role: booking.role,
                        },
                        bookings: [],
                    });
                }

                groupedMap.get(booking.user_id)!.bookings.push({
                    id: booking.id,
                    title: booking.title,
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    created_at: booking.created_at,
                });
            }

            const response: BookingsByUserResponse = {
                bookingsByUser: Array.from(groupedMap.values()),
            };
            res.json(response);
        } catch (error) {
            console.error('Get bookings by user error:', error);
            res.status(500).json({ error: 'Database error', message: 'Failed to fetch bookings' });
        }
    }
);

// GET /api/v1/bookings/summary - Usage summary (Owner/Admin)
router.get(
    '/summary',
    authenticate,
    authorize('owner', 'admin'),
    async (_req: Request, res: Response): Promise<void> => {
        try {
            const summary = await bookingQueries.countByUser();

            const formattedSummary: UserStats[] = summary.map((row) => ({
                user: { id: row.id, name: row.name, role: row.role },
                stats: {
                    totalBookings: row.booking_count,
                    totalMinutes: Math.round(row.total_minutes || 0),
                    totalHours: Math.round(((row.total_minutes || 0) / 60) * 100) / 100,
                },
            }));

            const totals = {
                totalUsers: summary.length,
                totalBookings: summary.reduce((sum, row) => sum + row.booking_count, 0),
                totalMinutes: Math.round(summary.reduce((sum, row) => sum + (row.total_minutes || 0), 0)),
            };

            const response: SummaryResponse = { summary: formattedSummary, totals };
            res.json(response);
        } catch (error) {
            console.error('Get summary error:', error);
            res.status(500).json({ error: 'Database error', message: 'Failed to fetch summary' });
        }
    }
);

// POST /api/v1/bookings - Create booking
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required', message: 'User not found' });
            return;
        }

        const { title, startTime, endTime } = req.body as CreateBookingRequestBody;

        const fieldValidation = validateRequiredFields(
            { title, startTime, endTime },
            ['title', 'startTime', 'endTime']
        );
        if (!fieldValidation.valid) {
            res.status(400).json({ error: 'Validation error', message: fieldValidation.error });
            return;
        }

        // Validate times
        const timeValidation = validateBookingTimes(startTime, endTime);
        if (!timeValidation.valid) {
            res.status(400).json({ error: 'Validation error', message: timeValidation.error });
            return;
        }

        // Check overlaps
        const overlaps = await bookingQueries.checkOverlap(startTime, endTime);
        if (overlaps.length > 0) {
            const error: ApiError = {
                error: 'Booking conflict',
                message: 'This time slot overlaps with an existing booking',
                conflictingBookings: overlaps.map((b) => ({
                    id: b.id,
                    title: b.title,
                    startTime: b.start_time,
                    endTime: b.end_time,
                })),
            };
            res.status(409).json(error);
            return;
        }

        const id = uuidv4();
        await bookingQueries.create(id, req.user.id, title.trim(), startTime, endTime);

        const newBooking = await bookingQueries.getById(id);
        if (!newBooking) {
            throw new Error('Failed to retrieve created booking');
        }

        const response: BookingResponse = {
            message: 'Booking created successfully',
            booking: newBooking,
        };
        res.status(201).json(response);
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Database error', message: 'Failed to create booking' });
    }
});

// DELETE /api/v1/bookings/:id - Delete booking
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required', message: 'User not found' });
            return;
        }

        const { id } = req.params;

        const booking = await bookingQueries.getById(id);
        if (!booking) {
            res.status(404).json({ error: 'Not found', message: 'Booking not found' });
            return;
        }

        // Check permissions
        const isOwnerOrAdmin = ['owner', 'admin'].includes(req.user.role);
        const isOwnBooking = booking.user_id === req.user.id;

        if (!isOwnerOrAdmin && !isOwnBooking) {
            res.status(403).json({ error: 'Access denied', message: 'You can only delete your own bookings' });
            return;
        }

        await bookingQueries.delete(id);
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ error: 'Database error', message: 'Failed to delete booking' });
    }
});

export default router;