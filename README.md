# Meeting Room Booking System (TypeScript)

A full-stack web application for managing meeting room bookings with role-based access control.

## Features

- **Full TypeScript implementation with strict type checking**
- **Role-based access control** (Admin, Owner, User)
- **Booking management** with overlap detection
- **User management** (Admin only)
- **Usage statistics and summaries** (Owner/Admin)

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React, Vite, TypeScript

## Time Handling

- All times stored in UTC (ISO 8601 format)
- The frontend converts local times to UTC before sending to the API
- **Back-to-back bookings are allowed**: If Booking A ends at 10:00 and Booking B starts at 10:00, they don't overlap
- Minimum booking: 15 minutes
- Maximum booking: 8 hours

## Type Safety

This implementation uses strict TypeScript with:
- Explicit type definitions for all API requests/responses
- Type-safe database queries
- Properly typed React components with interfaces for props
- No `any` types used

## User Deletion Behavior

When a user is deleted, all their bookings are automatically deleted (CASCADE delete).

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login by name
- `GET /api/v1/auth/me` - Get current user

### Users (Admin only)
- `GET /api/v1/users` - List all users
- `POST /api/v1/users` - Create user
- `PATCH /api/v1/users/:id/role` - Update user role
- `DELETE /api/v1/users/:id` - Delete user

### Bookings
- `GET /api/v1/bookings` - List all bookings
- `POST /api/v1/bookings` - Create booking
- `DELETE /api/v1/bookings/:id` - Delete booking
- `GET /api/v1/bookings/by-user` - Bookings grouped by user (Owner/Admin)
- `GET /api/v1/bookings/summary` - Usage statistics (Owner/Admin)

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on http://localhost:3001

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

## Default Users

| Name  | Role  |
|-------|-------|
| admin | Admin |
| owner | Owner |
| user1 | User  |
| user2 | User  |

## Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`

### Frontend (Vercel)

1. Import project to Vercel
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL` = your backend URL

## Permissions Matrix

| Action | User | Owner | Admin |
|--------|------|-------|-------|
| Create booking | ✅ | ✅ | ✅ |
| View all bookings | ✅ | ✅ | ✅ |
| Delete own booking | ✅ | ✅ | ✅ |
| Delete any booking | ❌ | ✅ | ✅ |
| View bookings by user | ❌ | ✅ | ✅ |
| View usage summary | ❌ | ✅ | ✅ |
| Create users | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
