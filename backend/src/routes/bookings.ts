import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { bookingQueries } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBookingTimes, validateRequiredFields } from '../utils/validation.js';
import {
  AuthenticatedRequest,
  CreateBookingRequestBody,
  BookingsResponse,
  BookingResponse,
  BookingsByUserResponse,
  BookingsByUserGroup,
  SummaryResponse,
  UserStats,
  ApiError,
  BookingWithUser,
} from '../types/index.js';

const router = Router();

/**
 * GET /api/v1/bookings
 * List all bookings (All authenticated users)
 */
router.get(
  '/',
  authenticate,
  (_req: AuthenticatedRequest, res: Response): void => {
    try {
      const bookings = bookingQueries.getAll();
      const response: BookingsResponse = { bookings };
      res.json(response);
    } catch (error) {
      const apiError: ApiError = {
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(apiError);
    }
  }
);

/**
 * GET /api/v1/bookings/by-user
 * Get bookings grouped by user (Owner and Admin only)
 */
router.get(
  '/by-user',
  authenticate,
  authorize('owner', 'admin'),
  (_req: AuthenticatedRequest, res: Response): void => {
    try {
      const bookings = bookingQueries.getGroupedByUser();

      // Group bookings by user
      const groupedMap = new Map<string, BookingsByUserGroup>();

      for (const booking of bookings) {
        const userId = booking.user_id;

        if (!groupedMap.has(userId)) {
          groupedMap.set(userId, {
            user: {
              id: booking.user_id,
              name: booking.name,
              role: booking.role,
            },
            bookings: [],
          });
        }

        const group = groupedMap.get(userId)!;
        group.bookings.push({
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
      const apiError: ApiError = {
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(apiError);
    }
  }
);

/**
 * GET /api/v1/bookings/summary
 * Get usage summary (Owner and Admin only)
 */
router.get(
  '/summary',
  authenticate,
  authorize('owner', 'admin'),
  (_req: AuthenticatedRequest, res: Response): void => {
    try {
      const summary = bookingQueries.countByUser();

      const formattedSummary: UserStats[] = summary.map((row) => ({
        user: {
          id: row.id,
          name: row.name,
          role: row.role,
        },
        stats: {
          totalBookings: row.booking_count,
          totalMinutes: Math.round(row.total_minutes || 0),
          totalHours: Math.round((row.total_minutes || 0) / 60 * 100) / 100,
        },
      }));

      const totals = {
        totalUsers: summary.length,
        totalBookings: summary.reduce((sum, row) => sum + row.booking_count, 0),
        totalMinutes: Math.round(
          summary.reduce((sum, row) => sum + (row.total_minutes || 0), 0)
        ),
      };

      const response: SummaryResponse = { summary: formattedSummary, totals };
      res.json(response);
    } catch (error) {
      const apiError: ApiError = {
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(apiError);
    }
  }
);

/**
 * POST /api/v1/bookings
 * Create a new booking (All authenticated users)
 */
router.post(
  '/',
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const { title, startTime, endTime } = req.body as CreateBookingRequestBody;

    // Validate required fields
    const fieldValidation = validateRequiredFields(
      { title, startTime, endTime },
      ['title', 'startTime', 'endTime']
    );
    if (!fieldValidation.valid) {
      const error: ApiError = {
        error: 'Validation error',
        message: fieldValidation.error!,
      };
      res.status(400).json(error);
      return;
    }

    // Validate booking times
    const timeValidation = validateBookingTimes(startTime, endTime);
    if (!timeValidation.valid) {
      const error: ApiError = {
        error: 'Validation error',
        message: timeValidation.error!,
      };
      res.status(400).json(error);
      return;
    }

    // Check for overlapping bookings
    const overlappingBookings = bookingQueries.checkOverlap(endTime, startTime, 'new');

    if (overlappingBookings.length > 0) {
      const error: ApiError = {
        error: 'Booking conflict',
        message: 'This time slot overlaps with an existing booking',
        conflictingBookings: overlappingBookings.map((b) => ({
          id: b.id,
          title: b.title,
          startTime: b.start_time,
          endTime: b.end_time,
        })),
      };
      res.status(409).json(error);
      return;
    }

    try {
      const id = uuidv4();
      console.log(`Creating booking with ID: ${id} for user: ${req.user!.id}`);
      bookingQueries.create(id, req.user!.id, title.trim(), startTime, endTime);

      const newBooking = bookingQueries.getById(id);
      if (!newBooking) {
        throw new Error('Failed to create booking');
      }

      const response: BookingResponse = {
        message: 'Booking created successfully',
        booking: newBooking,
      };
      res.status(201).json(response);
    } catch (error) {
      const apiError: ApiError = {
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(apiError);
    }
  }
);

/**
 * DELETE /api/v1/bookings/:id
 * Delete a booking
 */
router.delete(
  '/:id',
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const { id } = req.params;

    // Check if booking exists
    const booking = bookingQueries.getById(id);
    if (!booking) {
      const error: ApiError = {
        error: 'Not found',
        message: 'Booking not found',
      };
      res.status(404).json(error);
      return;
    }

    // Check permissions
    const isOwnerOrAdmin = ['owner', 'admin'].includes(req.user!.role);
    const isOwnBooking = booking.user_id === req.user!.id;

    if (!isOwnerOrAdmin && !isOwnBooking) {
      const error: ApiError = {
        error: 'Access denied',
        message: 'You can only delete your own bookings',
      };
      res.status(403).json(error);
      return;
    }

    try {
      bookingQueries.delete(id);
      res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
      const apiError: ApiError = {
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(apiError);
    }
  }
);

export default router;