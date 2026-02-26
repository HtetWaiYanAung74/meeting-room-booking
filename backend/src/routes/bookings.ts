import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { bookingQueries } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBookingTimes, validateRequiredFields } from '../utils/validation.js';
import {
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

router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await bookingQueries.getAll();
    const response: BookingsResponse = { bookings };
    res.json(response);
  } catch (error) {
    console.error('Get bookings error:', error);
    const apiError: ApiError = {
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(apiError);
  }
});

router.get(
  '/by-user',
  authenticate,
  authorize('owner', 'admin'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const bookings = await bookingQueries.getGroupedByUser();

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
      console.error('Get bookings by user error:', error);
      const apiError: ApiError = {
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(apiError);
    }
  }
);

router.get(
  '/summary',
  authenticate,
  authorize('owner', 'admin'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const summary = await bookingQueries.countByUser();

      const formattedSummary: UserStats[] = summary.map((row) => ({
        user: {
          id: row.id,
          name: row.name,
          role: row.role,
        },
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
      const apiError: ApiError = {
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(apiError);
    }
  }
);

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const error: ApiError = {
        error: 'Authentication required',
        message: 'User not found in request',
      };
      res.status(401).json(error);
      return;
    }

    const { title, startTime, endTime } = req.body as CreateBookingRequestBody;

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

    const timeValidation = validateBookingTimes(startTime, endTime);
    if (!timeValidation.valid) {
      const error: ApiError = {
        error: 'Validation error',
        message: timeValidation.error!,
      };
      res.status(400).json(error);
      return;
    }

    const overlappingBookings = await bookingQueries.checkOverlap(endTime, startTime, 'new');

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

    const id = uuidv4();
    const userId = req.user.id;

    await bookingQueries.create(id, userId, title.trim(), startTime, endTime);

    const newBooking = await bookingQueries.getById(id);
    if (!newBooking) {
      throw new Error('Failed to create booking');
    }

    const response: BookingResponse = {
      message: 'Booking created successfully',
      booking: newBooking,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create booking error:', error);
    const apiError: ApiError = {
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(apiError);
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const error: ApiError = {
        error: 'Authentication required',
        message: 'User not found in request',
      };
      res.status(401).json(error);
      return;
    }

    const { id } = req.params;

    const booking = await bookingQueries.getById(id);
    if (!booking) {
      const error: ApiError = {
        error: 'Not found',
        message: 'Booking not found',
      };
      res.status(404).json(error);
      return;
    }

    const isOwnerOrAdmin = ['owner', 'admin'].includes(req.user.role);
    const isOwnBooking = booking.user_id === req.user.id;

    if (!isOwnerOrAdmin && !isOwnBooking) {
      const error: ApiError = {
        error: 'Access denied',
        message: 'You can only delete your own bookings',
      };
      res.status(403).json(error);
      return;
    }

    await bookingQueries.delete(id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    const apiError: ApiError = {
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(apiError);
  }
});

export default router;