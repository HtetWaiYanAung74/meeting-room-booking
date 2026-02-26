import { ValidationResult, UserRole } from '../types/index.js';

/**
 * Time Handling Documentation:
 *
 * 1. All times are expected in ISO 8601 format (e.g., "2024-01-15T10:00:00.000Z")
 * 2. All times are stored and compared in UTC
 * 3. The frontend should convert local times to UTC before sending to the API
 * 4. Back-to-back bookings are ALLOWED:
 *    - If Booking A ends at 10:00 and Booking B starts at 10:00, they don't overlap
 *    - Overlap check uses strict inequality: (startA < endB) AND (endA > startB)
 */

/**
 * Validates booking time constraints
 */
export function validateBookingTimes(
    startTime: string,
    endTime: string
): ValidationResult {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime())) {
        return { valid: false, error: 'Invalid start time format. Use ISO 8601 format.' };
    }

    if (isNaN(end.getTime())) {
        return { valid: false, error: 'Invalid end time format. Use ISO 8601 format.' };
    }

    // Rule 1: startTime must be before endTime
    if (start >= end) {
        return { valid: false, error: 'Start time must be before end time.' };
    }

    // Check minimum booking duration (15 minutes)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 15) {
        return { valid: false, error: 'Minimum booking duration is 15 minutes.' };
    }

    // Check maximum booking duration (8 hours)
    if (durationMinutes > 480) {
        return { valid: false, error: 'Maximum booking duration is 8 hours.' };
    }

    return { valid: true };
}

/**
 * Validates required string fields
 */
export function validateRequiredFields(
    data: Record<string, unknown>,
    requiredFields: string[]
): ValidationResult {
    for (const field of requiredFields) {
        const value = data[field];
        if (!value || (typeof value === 'string' && !value.trim())) {
            return { valid: false, error: `${field} is required.` };
        }
    }
    return { valid: true };
}

/**
 * Validates role value
 */
export function validateRole(role: string): ValidationResult {
    const validRoles: UserRole[] = ['admin', 'owner', 'user'];
    if (!validRoles.includes(role as UserRole)) {
        return {
            valid: false,
            error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        };
    }
    return { valid: true };
}

/**
 * Type guard to check if role is valid
 */
export function isValidRole(role: string): role is UserRole {
    return ['admin', 'owner', 'user'].includes(role);
}