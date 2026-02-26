import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type {
    User,
    Booking,
    BookingWithUser,
    UserRole,
    BookingSummaryRow,
    OverlapCheckRow,
} from '../types/index.js';

const { Pool } = pg;

// Create connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});

export async function initializeDatabase(): Promise<void> {
    const client = await pool.connect();

    try {
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'owner', 'user')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // Create bookings table with CASCADE delete
        await client.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // Create index for faster overlap queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bookings_times ON bookings(start_time, end_time)
        `);

        // Seed default users if none exist
        const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(userCountResult.rows[0].count, 10);

        if (userCount === 0) {
            const seedUsers: Array<{ name: string; role: UserRole }> = [
                { name: 'admin', role: 'admin' },
                { name: 'owner', role: 'owner' },
                { name: 'user1', role: 'user' },
                { name: 'user2', role: 'user' },
            ];

            for (const user of seedUsers) {
                await client.query(
                    'INSERT INTO users (id, name, role) VALUES ($1, $2, $3)',
                    [uuidv4(), user.name, user.role]
                );
            }
            console.log('Database seeded with default users');
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// User queries
export const userQueries = {
    getAll: async (): Promise<User[]> => {
        const result = await pool.query(
            'SELECT id, name, role, created_at FROM users ORDER BY created_at'
        );
        return result.rows;
    },

    getById: async (id: string | string[]): Promise<User | undefined> => {
        const result = await pool.query(
            'SELECT id, name, role, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    getByUsername: async (name: string): Promise<User | undefined> => {
        const result = await pool.query(
            'SELECT id, name, role, created_at FROM users WHERE name = $1',
            [name]
        );
        return result.rows[0];
    },

    create: async (id: string | string[], name: string, role: UserRole): Promise<void> => {
        await pool.query(
            'INSERT INTO users (id, name, role) VALUES ($1, $2, $3)',
            [id, name, role]
        );
    },

    updateRole: async (id: string | string[], role: UserRole): Promise<void> => {
        await pool.query('UPDATE users SET role = $1 WHERE id = ANY($2::uuid[])', [role, id]);
    },

    delete: async (id: string | string[]): Promise<number> => {
        const result = await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [id]);
        return result.rowCount || 0;
    },
};

// Booking queries
export const bookingQueries = {
    getAll: async (): Promise<BookingWithUser[]> => {
        const result = await pool.query(`
            SELECT b.id, b.user_id, b.title, b.start_time, b.end_time, b.created_at,
            u.name, u.role as role
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.start_time
        `);
        return result.rows;
    },

    getById: async (id: string | string[]): Promise<BookingWithUser | undefined> => {
        const result = await pool.query(`
            SELECT b.*, u.name as name, u.role as role
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ANY($1::uuid[])
        `, [id]);
        return result.rows[0];
    },

    getByUserId: async (userId: string | string[]): Promise<Booking[]> => {
        const result = await pool.query(
            `SELECT * FROM bookings WHERE user_id = ANY($1::uuid[]) ORDER BY start_time`,
            [userId]
        );
        return result.rows;
    },

    checkOverlap: async (
        endTime: string,
        startTime: string,
        excludeId: string
    ): Promise<OverlapCheckRow[]> => {
        const result = await pool.query(`
            SELECT id, title, start_time, end_time
            FROM bookings
            WHERE start_time < $1 AND end_time > $2
            AND id != $3
        `, [endTime, startTime, excludeId]);
        return result.rows;
    },

    create: async (
        id: string | string[],
        userId: string | string[],
        title: string,
        startTime: string,
        endTime: string
    ): Promise<void> => {
        await pool.query(
            'INSERT INTO bookings (id, user_id, title, start_time, end_time) VALUES ($1, $2, $3, $4, $5)',
            [id, userId, title, startTime, endTime]
        );
    },

    delete: async (id: string | string[]): Promise<number> => {
        const result = await pool.query('DELETE FROM bookings WHERE id = ANY($1::uuid[])', [id]);
        return result.rowCount || 0;
    },

    countByUser: async (): Promise<BookingSummaryRow[]> => {
        const result = await pool.query(`
            SELECT u.id, u.name, u.role, 
            COUNT(b.id)::int as booking_count,
            COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 60), 0)::float as total_minutes
            FROM users u
            LEFT JOIN bookings b ON u.id = b.user_id
            GROUP BY u.id
            ORDER BY booking_count DESC
        `);
        return result.rows;
    },

    getGroupedByUser: async (): Promise<BookingWithUser[]> => {
        const result = await pool.query(`
            SELECT b.id, b.user_id, b.title, b.start_time, b.end_time, b.created_at,
            u.name, u.role as role
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            ORDER BY u.name, b.start_time
        `);
        return result.rows;
    },
};

export { pool };