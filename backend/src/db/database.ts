import Database, { Database as DatabaseType } from "better-sqlite3";
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingSummaryRow, BookingWithUser, OverlapCheckRow, User, UserRole } from "../types/index.js";

const db: DatabaseType = new Database("meeting_room.db");

export function initializeDatabase(): void {
    // enable foreign key constraints
    db.pragma("foreign_keys = ON");

    // Create users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'user')),
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    // Create bookings table with cascading delete
    db.exec(`
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create index for faster overlap queries
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings (start_time, end_time)
    `);

    // Seed default admin user if not exists
    const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };

    if (userCount.count === 0) {
        const seedUsers: Array<{ id: string; name: string; role: UserRole }> = [
            { id: uuidv4(), name: "admin", role: "admin" },
            { id: uuidv4(), name: "owner", role: "owner" },
            { id: uuidv4(), name: "user1", role: "user" },
            { id: uuidv4(), name: "user2", role: "user" },
        ];

        const insertUser = db.prepare("INSERT INTO users (id, name, role) VALUES (?, ?, ?)");
        for (const user of seedUsers) {
            insertUser.run(user.id, user.name, user.role);
        }
        console.log("Database initialized with default users.");
    }
}
// User queries
export const userQueries = {
    getAll: (): User[] => {
        return db.prepare("SELECT id, name, role FROM users ORDER BY created_at DESC").all() as User[];
    },
    getById: (id: string | string[]): User | undefined => {
        return db.prepare("SELECT id, name, role FROM users WHERE id = ?").get(id) as User | undefined;
    },
    getByName: (name: string): User | undefined => {
        return db.prepare("SELECT id, name, role FROM users WHERE name = ?").get(name) as User | undefined;
    },
    create: (id: string | string[], name: string | string[], role: UserRole): void => {
        db.prepare("INSERT INTO users (id, name, role) VALUES (?, ?, ?)").run(id, name, role);
    },
    updateRole: (id: string | string[], role: UserRole): void => {
        db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
    },
    delete: (id: string | string[]): Database.RunResult => {
        return db.prepare("DELETE FROM users WHERE id = ?").run(id);
    },
};

// Booking queries
export const bookingQueries = {
    getAll: (): BookingWithUser[] => {
        return db.prepare(`
                SELECT b.*, u.name, u.role
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                ORDER BY b.start_time
            `).all() as BookingWithUser[];
    },
    getById: (id: string | string[]): BookingWithUser | undefined => {
        return db.prepare(`
                SELECT b.*, u.name, u.role
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                WHERE b.id = ?
            `).get(id) as BookingWithUser | undefined;
    },
    getByUserId: (userId: string | string[]): Booking[] => {
        return db.prepare(`
                SELECT *
                FROM bookings
                WHERE user_id = ?
                ORDER BY start_time
            `).all(userId) as Booking[];
    },
    checkOverlap: (endTime: string, startTime: string, excludeId: string): OverlapCheckRow[] => {
        return db.prepare(`
                SELECT *
                FROM bookings
                WHERE start_time < ? AND end_time > ?
                AND id != ?
            `).all(endTime, startTime, excludeId) as OverlapCheckRow[];
    },
    create: (id: string | string[], userId: string | string[], title: string, startTime: string, endTime: string): void => {
        db.prepare(`
                INSERT INTO bookings (id, user_id, title, start_time, end_time)
                VALUES (?, ?, ?, ?, ?)
            `).run(id, userId, title, startTime, endTime);
    },
    delete: (id: string | string[]): Database.RunResult => {
        return db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
    },
    countByUser: (): BookingSummaryRow[] => {
        return db.prepare(`
                SELECT u.*, COUNT(b.id) AS booking_count,
                SUM(
                    CASE WHEN b.id IS NOT NULL 
                    THEN (julianday(b.end_time) - julianday(b.start_time)) * 24 * 60 
                    ELSE 0 END
                ) as total_minutes FROM users u
                LEFT JOIN bookings b ON u.id = b.user_id
                GROUP BY u.id
                ORDER BY booking_count DESC
            `).all() as BookingSummaryRow[];
    },
    getGroupedByUser: (): BookingWithUser[] => {
        return db.prepare(`
                SELECT b.*, u.name, u.role as user_role
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                ORDER BY u.name, b.start_time
            `).all() as BookingWithUser[];
    }
};

export { db };