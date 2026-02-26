import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import bookingRoutes from './routes/bookings.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});