# 🏢 Meeting Room Booking System

A full-stack meeting room booking application with role-based access control, password authentication, and real-time booking conflict detection.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Default Users](#default-users)
- [Authentication](#authentication)

---

## Features

### Authentication
- Password-based login with bcrypt hashing
- Quick login buttons that populate the username field for demo accounts
- Persistent session via redux-persist (loading states auto-reset on app restart)
- Request timeout handling with recovery UI for network failures

### Booking Management
- Create, view, and delete meeting room bookings
- Automatic overlap/conflict detection
- Date and time validation (no past bookings, minimum 5 min, maximum 24 hrs)
- Bookings grouped by user view for owners and admins

### User Management (Admin Only)
- Create users with username, role, and password
- Update user roles
- Delete users (cascades to their bookings)

### Role-Based Access Control

| Feature              | User | Owner | Admin |
|----------------------|------|-------|-------|
| View all bookings    | ✅   | ✅    | ✅    |
| Create bookings      | ✅   | ✅    | ✅    |
| Delete own bookings  | ✅   | ✅    | ✅    |
| Delete any booking   | ❌   | ✅    | ✅    |
| View bookings by user| ❌   | ✅    | ✅    |
| View booking summary | ❌   | ✅    | ✅    |
| Manage users         | ❌   | ❌    | ✅    |

### Form Validation
- Frontend: real-time field validation on blur and submit with inline error messages
- Backend: returns all field-level errors in a single response
- Required field indicators and shake animation on errors

---

## Tech Stack

### Frontend
- React 18 with TypeScript
- Redux Toolkit with redux-persist
- Vite
- CSS (custom design system with variables)

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL
- bcryptjs for password hashing
- UUID for unique identifiers

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1) Clone and install

```bash
git clone <repository-url>
cd meeting-room-booking

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```
### 2) Start the application

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

The frontend runs on `https://meeting-room-booking-beryl.vercel.app/` and the backend on `https://meeting-room-booking-ocuy.onrender.com/`.

---

## Default Users

Seeded on first startup. The default password for all accounts is the value of `SEED_DEFAULT_PASSWORD` (defaults to `password123`).

| Username | Role  | Password      |
|----------|-------|---------------|
| admin    | Admin | password123   |
| owner    | Owner | password123   |
| user1    | User  | password123   |
| user2    | User  | password123   |

---

## Authentication

The application uses a simple header-based authentication flow.

### Login Flow

1. User enters username and password (or clicks a quick login button to populate the username, then enters password).
2. `POST /api/auth/login` validates credentials against a bcrypt hash stored in the database.
3. On success, the server returns the user object (id, username, role).
4. The frontend stores the user in Redux (persisted to localStorage) and attaches `x-user-id` header to all subsequent requests.
5. The backend `authenticate` middleware reads `x-user-id` to identify the caller; `authorize` checks the role.

### Quick Login Buttons

Quick login buttons populate the username field in the login form. The user must still enter the password and click **Sign In**. No login occurs without a valid password.

### Session Recovery

If the app gets stuck in a loading state (e.g. network failure during login), the following safeguards apply:

- redux-persist transform resets `isLoading` to `false` on every rehydration
- A "Reset and try again" button appears after a brief delay
- A 30-second safety timeout auto-resets the loading state
- API requests abort after 15 seconds with a clear error message

---
## Validation Rules

### Username
- Required
- 2–50 characters
- Letters, numbers, and underscores only

### Password
- Required
- Minimum 6 characters

### Booking Title
- Required
- 3–100 characters

### Booking Times
- Start time cannot be in the past
- End time must be after start time
- Minimum duration: 5 minutes
- Maximum duration: 24 hours
- No overlapping bookings allowed

### User Role
- Must be one of: `admin`, `owner`, `user`
