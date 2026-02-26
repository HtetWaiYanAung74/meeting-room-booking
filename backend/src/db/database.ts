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

// Supabase connection configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
}

// Create connection pool with Supabase settings
const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false, // Required for Supabase
    },
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Connection event handlers
pool.on('connect', () => {
    console.log('✅ Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Supabase pool error:', err);
});

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
    const client = await pool.connect();

    try {
        console.log('🔄 Initializing database tables...');

        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'owner', 'user')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // Create bookings table
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
            CREATE INDEX IF NOT EXISTS idx_bookings_times 
            ON bookings(start_time, end_time)
        `);

        // Seed default users if none exist
        const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(userCountResult.rows[0].count, 10);

        if (userCount === 0) {
            console.log('🌱 Seeding default users...');

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
                console.log(`  ✅ Created user: ${user.name} (${user.role})`);
            }
        }

        console.log('🎉 Database initialization complete!');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
    try {
        const result = await pool.query('SELECT NOW()');
        return !!result.rows[0];
    } catch {
        return false;
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
            'SELECT id, name, role, created_at FROM users WHERE id = ANY($1::text[])',
            [Array.isArray(id) ? id : [id]]
        );
        return result.rows[0];
    },

    getByName: async (name: string): Promise<User | undefined> => {
        const result = await pool.query(
            'SELECT id, name, role, created_at FROM users WHERE LOWER(name) = LOWER($1)',
            [name]
        );
        return result.rows[0];
    },

    create: async (id: string, name: string, role: UserRole): Promise<User> => {
        const result = await pool.query(`
            INSERT INTO users (id, name, role) 
            VALUES ($1, $2, $3) 
            RETURNING id, name, role, created_at
        `, [id, name.toLowerCase(), role]);
        return result.rows[0];
    },

    updateRole: async (id: string | string[], role: UserRole): Promise<User> => {
        const result = await pool.query(`
            UPDATE users SET role = $1 WHERE id = ANY($2::text[])
            RETURNING id, name, role, created_at
        `, [role, Array.isArray(id) ? id : [id]]);
        return result.rows[0];
    },

    delete: async (id: string | string[]): Promise<number> => {
        const result = await pool.query('DELETE FROM users WHERE id = ANY($1::text[])', [Array.isArray(id) ? id : [id]]);
        return result.rowCount || 0;
    },

    count: async (): Promise<number> => {
        const result = await pool.query('SELECT COUNT(*) as count FROM users');
        return parseInt(result.rows[0].count, 10);
    },
};

// Booking queries
export const bookingQueries = {
    getAll: async (): Promise<BookingWithUser[]> => {
        const result = await pool.query(`
            SELECT b.*, u.name as name, u.role as role
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.start_time ASC
        `);
        return result.rows;
    },

    getById: async (id: string | string[]): Promise<BookingWithUser | undefined> => {
        const result = await pool.query(`
            SELECT b.*, u.name as name, u.role as role FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ANY($1::text[])
        `, [Array.isArray(id) ? id : [id]]);
        return result.rows[0];
    },

    getByUserId: async (userId: string): Promise<Booking[]> => {
        const result = await pool.query(`
            SELECT * FROM bookings
            WHERE user_id = $1
            ORDER BY start_time ASC
        `, [userId]);
        return result.rows;
    },

    checkOverlap: async (
        startTime: string,
        endTime: string,
        excludeId?: string
    ): Promise<OverlapCheckRow[]> => {
        const query = excludeId ? `
            SELECT id, title, start_time, end_time
            FROM bookings
            WHERE start_time < $2 AND end_time > $1 AND id != $3
        ` : `
            SELECT id, title, start_time, end_time
            FROM bookings
            WHERE start_time < $2 AND end_time > $1
        `;

        const params = excludeId ? [startTime, endTime, excludeId] : [startTime, endTime];
        const result = await pool.query(query, params);
        return result.rows;
    },

    create: async (
        id: string,
        userId: string,
        title: string,
        startTime: string,
        endTime: string
    ): Promise<void> => {
        await pool.query(`
            INSERT INTO bookings (id, user_id, title, start_time, end_time) 
            VALUES ($1, $2, $3, $4, $5)`,
            [id, userId, title, startTime, endTime]
        );
    },

    delete: async (id: string | string[]): Promise<number> => {
        const result = await pool.query('DELETE FROM bookings WHERE id = ANY($1::text[])', [Array.isArray(id) ? id : [id]]);
        return result.rowCount || 0;
    },

    countByUser: async (): Promise<BookingSummaryRow[]> => {
        const result = await pool.query(`
            SELECT 
            u.id, 
            u.name as name, 
            u.role, 
            COUNT(b.id)::int as booking_count,
            COALESCE(
                SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 60), 0
            )::float as total_minutes
            FROM users u
            LEFT JOIN bookings b ON u.id = b.user_id
            GROUP BY u.id, u.name as name, u.role
            ORDER BY booking_count DESC
        `);
        return result.rows;
    },

    getGroupedByUser: async (): Promise<BookingWithUser[]> => {
        const result = await pool.query(`
            SELECT b.*, u.name as name, u.role as role
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            ORDER BY u.name ASC, b.start_time ASC
        `);
        return result.rows;
    },

    count: async (): Promise<number> => {
        const result = await pool.query('SELECT COUNT(*) as count FROM bookings');
        return parseInt(result.rows[0].count, 10);
    },
};

// Export pool for direct queries if needed
export { pool };