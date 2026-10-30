# 🌿 Campus Resource Management & Allocation System

> A production-grade, full-stack campus resource management ecosystem featuring **Role-Based Access Control (Admin, Faculty, Student)**, **Intelligent Conflict Overlap Detection**, **Booking Approval Workflow**, **My Bookings Rescheduling & Cancellation**, **Per-Resource Calendar Schedules**, and an **Executive Admin Dashboard** with real-time utilization analytics and Green Campus Eco-Scores.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React Icons, Recharts, FullCalendar v6, `qrcode.react`.
- **Backend**: Node.js, Express.js REST API, JWT Authentication, bcryptjs password hashing, CORS, `node-cron`, Zod validation.
- **Database**: PostgreSQL via Prisma ORM.
- **Deployment**: Render (backend/API) and Vercel (frontend).

---

## 🚀 Pre-Seeded Demo Credentials

The database is pre-populated with campus seed data (one admin, three faculty, three students, 15+ resources across 5 buildings, bookings, notifications, feedback, and audit logs).

| Role | Demo Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **👑 ADMIN** | Mamta — `admin@campus.com` | `Admin@123` | Full system control, resource CRUD, approvals/rejections, maintenance locking, energy & utilization analytics, audit logs |
| **🎓 FACULTY** | Vineesha — `vineesha@campus.com`<br>Akash — `akash@campus.com`<br>Vikash — `vikash@campus.com` | `Faculty@123` | Submit class/event bookings, track own reservations, view approved schedules and Active QR Passes |
| **🎒 STUDENT** | Monisha — `monisha@campus.com`<br>Jushya — `jushya@campus.com`<br>Harishmitha — `harishmitha@campus.com` | `Student@123` | Search & filter catalog, view mapped faculty schedules, leave feedback |

> Faculty and student booking requests remain pending until admin approval. QR passes are created only after approval.
> Student schedules are restricted to their mapped faculty: Vineesha → Monisha, Akash → Jushya, and Vikash → Harishmitha. Mamta can manage these assignments from Admin User Management.

---

## ✨ Core Features & Requirements Matrix

| # | Feature | Implementation Details |
| :--- | :--- | :--- |
| **1** | **Authentication** | Public registration always creates a `STUDENT`; admins manage higher roles through protected admin routes. Login and role-based access use JWTs on protected routes. |
| **2** | **Resource Management (Admin)** | Complete CRUD for classrooms, computer labs, seminar halls, auditoriums, projectors, and sports facilities with name, type, capacity, building/floor/room location, operating hours, and status (`AVAILABLE` / `MAINTENANCE`). |
| **3** | **Booking & Conflict Guard** | Users select resource, date, start time, end time. Double-booking prevention via strict overlap rule: `existing_start < new_end AND existing_end > new_start`. Validates a maximum 4-hour duration, at most 5 future pending/approved bookings per user, blackout dates, and that `date` is not in the past. |
| **4** | **Approval Workflow** | Faculty bookings start as `PENDING`. Administrators review, approve, or reject requests; only approved class bookings appear in the matching students' schedule. |
| **5** | **My Bookings** | Users can view all their bookings, cancel upcoming sessions, and **reschedule** dates/times with live conflict checking and status updates. |
| **6** | **Search & Filters** | Filter campus resources simultaneously by **Type** (Classroom, Lab, Hall, etc.), **Capacity** (15+, 30+, 50+, 100+, 200+), **Location** (Building), and **Availability** (`AVAILABLE`, `MAINTENANCE`). |
| **7** | **Calendar View per Resource** | Master visual calendar powered by FullCalendar with a **Per-Resource Filter Dropdown** allowing users to inspect the schedule of individual rooms. |
| **8** | **Admin Dashboard** | Executive metrics showing **Total Resources**, **Pending Requests**, **Utilization Bar Chart** (booking distribution across resources), and **Most-Used Resources** ranking table. |
| **9** | **Notifications** | In-app notification bell with unread counter alerting users when bookings are created, approved, rejected, rescheduled, or cancelled. |
| **10** | **Calendar & CSV Export** | Owners and admins can download approved bookings as Asia/Kolkata `.ics` files. Admins can export all bookings to CSV, with optional date filters. |

---

## 📂 Full Folder Structure

```
campus_resource-main/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL database schema
│   │   └── seed.js                # Legacy destructive seed (do not run)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js             # Environment variables configuration
│   │   │   └── prisma.js          # PrismaClient singleton instance
│   │   ├── controllers/
│   │   │   ├── adminController.js         # User role updates, settings, audit logs
│   │   │   ├── analyticsController.js     # System overview, utilization, energy metrics
│   │   │   ├── authController.js          # Student registration, login, profile
│   │   │   ├── bookingController.js       # Bookings CRUD, reschedule, overlap rule, approve/reject
│   │   │   ├── checkInController.js       # QR code pass scan & check-in simulation
│   │   │   ├── feedbackController.js      # Post-usage ratings & cleanliness reviews
│   │   │   ├── maintenanceController.js   # Maintenance tickets & locking
│   │   │   ├── notificationController.js  # In-app notifications & read states
│   │   │   └── resourceController.js      # Resource CRUD, building/category metadata
│   │   ├── middleware/
│   │   │   └── authMiddleware.js          # JWT authentication & RBAC authorization
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── bookingRoutes.js           # Includes POST /, PATCH /:id/reschedule, PATCH /:id/cancel
│   │   │   ├── checkInRoutes.js
│   │   │   ├── feedbackRoutes.js
│   │   │   ├── maintenanceRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   └── resourceRoutes.js
│   │   ├── services/
│   │   │   ├── ecoService.js              # Real-time kWh power and Eco Score calculation
│   │   │   ├── noShowService.js           # 15-minute auto-release background job
│   │   │   ├── occupancyService.js        # Real-time room occupancy evaluation
│   │   │   └── recommendationService.js   # AI multi-criteria resource recommendation
│   │   ├── utils/
│   │   │   ├── bookingRules.js            # Shared booking limits and blackout-date rules
│   │   │   └── time.js                    # Timezone & slot calculation utilities
│   │   └── server.js                      # Express application entry point
│   ├── .env.example
│   ├── package.json
│   ├── check_data.js
│   ├── seed-campus-data.js        # Safe, additive, idempotent seed
│   └── verify_e2e.js                      # End-to-end automated API verification test
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConflictWarningModal.jsx   # Double-booking conflict dialog with exact times
│   │   │   ├── EcoBadge.jsx               # Green campus eco efficiency score badge
│   │   │   ├── FeedbackModal.jsx          # Post-session rating dialog
│   │   │   ├── Navbar.jsx                 # Top bar with notifications & user profile
│   │   │   ├── QRModal.jsx                # Digital QR access pass & check-in scanner
│   │   │   ├── RecommendationCard.jsx     # AI recommendation match card
│   │   │   ├── RescheduleModal.jsx        # Interactive booking rescheduling modal
│   │   │   └── Sidebar.jsx                # Role-based sidebar navigation
│   │   ├── context/
│   │   │   ├── AuthContext.jsx            # User authentication state & methods
│   │   │   └── NotificationContext.jsx    # Real-time notification unread counts
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx        # Responsive application wrapper
│   │   ├── pages/
│   │   │   ├── AdminBookingMgmtPage.jsx   # Admin approvals & rejections table
│   │   │   ├── AdminDashboard.jsx         # Executive dashboard with utilization & ranking
│   │   │   ├── AdminResourceMgmtPage.jsx  # Resource CRUD & status management
│   │   │   ├── BookingCalendarPage.jsx    # FullCalendar schedule with per-resource filter
│   │   │   ├── BookingHistoryPage.jsx     # My Bookings (View, Cancel, Reschedule)
│   │   │   ├── EnergyAnalyticsPage.jsx    # Eco energy graphs & sustainability metrics
│   │   │   ├── FacultyDashboard.jsx       # Faculty department dashboard
│   │   │   ├── FeedbackPage.jsx           # Resource ratings & reviews list
│   │   │   ├── LandingPage.jsx            # Modern public landing portal
│   │   │   ├── LoginPage.jsx              # Manual sign-in with example credentials
│   │   │   ├── MaintenanceMgmtPage.jsx    # Facility maintenance logs
│   │   │   ├── NotificationsPage.jsx      # In-app notifications center
│   │   │   ├── ProfilePage.jsx            # User account settings
│   │   │   ├── RegisterPage.jsx           # Sign-up with role selection dropdown
│   │   │   ├── ResourceCatalogPage.jsx    # Catalog with type, capacity, location, status filters
│   │   │   ├── ResourceDetailPage.jsx     # Facility details, specs, upcoming slots
│   │   │   ├── SmartBookingPage.jsx       # AI smart booking & conflict checking
│   │   │   └── StudentDashboard.jsx       # Student quick-actions dashboard
│   │   ├── services/
│   │   │   ├── api.js                     # Configured Axios client with JWT interceptor
│   │   │   └── downloads.js               # Authenticated calendar and CSV downloads
│   │   ├── App.jsx                        # React Router configuration & route guards
│   │   ├── index.css                      # Tailwind CSS design system
│   │   └── main.jsx                       # React DOM entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## 🗄️ Database Schema & Relational Models

Defined in [`schema.prisma`](file:///c:/Users/mamta/OneDrive/Desktop/campus_resource-main/backend/prisma/schema.prisma):

- **`User`**: `id` (UUID PK), `name`, `email` (unique), `password`, `role` (`ADMIN`, `FACULTY`, `STUDENT`), `department`, `phone`, timestamps.
- **`Building`**: `id` (UUID PK), `name`, `code` (unique), `totalFloors`, `energyEfficiencyRating`.
- **`ResourceType`**: `id` (UUID PK), `name` (unique), `category` (`CLASSROOM`, `COMPUTER_LAB`, `SEMINAR_HALL`, `AUDITORIUM`, `SPORTS_GROUND`, `EQUIPMENT`), `description`.
- **`Resource`**: `id` (UUID PK), `name`, `typeId` (FK -> ResourceType), `buildingId` (FK -> Building), `floor`, `roomNumber`, `capacity`, `description`, `facilities` (JSON), `availableEquipment` (JSON), `operatingHoursStart`, `operatingHoursEnd`, `status` (`AVAILABLE`, `MAINTENANCE`), `isArchived`, `ecoScore`, `basePowerConsumptionKw`.
- **`Booking`**: `id` (UUID PK), `bookingCode` (unique), `userId` (FK -> User), `resourceId` (FK -> Resource), `purpose`, `eventType`, `attendeeCount`, `date` (YYYY-MM-DD), `startTime` (HH:MM), `endTime` (HH:MM), `status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `CHECKED_IN`, `CHECKED_OUT`, `NO_SHOW`), `rejectionReason`, `qrCodeData`, `estimatedEnergyKwh`, `ecoScoreCalculated`.
- **`BookingApproval`**: `id` (UUID PK), `bookingId` (FK -> Booking CASCADE), `approvedById` (FK -> User), `status`, `remarks`, `createdAt`.
- **`CheckIn`**: `id` (UUID PK), `bookingId` (FK -> Booking CASCADE), `userId` (FK -> User), `checkInTime`, `checkOutTime`, `status`.
- **`Maintenance`**: `id` (UUID PK), `resourceId` (FK -> Resource CASCADE), `issue`, `priority`, `status` (`REPORTED`, `IN_PROGRESS`, `COMPLETED`).
- **`Notification`**: `id` (UUID PK), `userId` (FK -> User CASCADE), `title`, `message`, `type`, `isRead`, `createdAt`.
- **`AuditLog`**: `id` (UUID PK), `userId` (FK -> User), `action`, `entity`, `entityId`, `details`, `createdAt`.

---

## ⚡ Setup & Execution Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)
- A PostgreSQL database

### Environment variables

Create `backend/.env` with:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
CORS_ORIGIN="http://localhost:3000"
TIMEZONE="Asia/Kolkata"
NODE_ENV="development"
```

Set `frontend/.env` to the backend API URL:

```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

Never commit real secrets or `.env` files.

### Step 1: Start Backend Server
```bash
cd backend

# Install dependencies
npm install

# For a new PostgreSQL database only: create/sync the schema.
# Back up any database containing important data before schema changes.
npx prisma db push

# Safe, additive seed; requires the seven demo accounts to already exist.
npm run db:seed

# Start backend server on port 5000
npm start
```
*API Base URL:* `http://localhost:5000/api`

### Step 2: Start Frontend Application
```bash
cd frontend

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```
Vite prints the local web application URL when it starts.

### Safe campus-data seed

`backend/seed-campus-data.js` is additive, idempotent, and does not delete or
overwrite users or existing settings. It adds missing campus data and the
`blackout_dates` setting (initially empty). Run it from `backend/` with a
configured `DATABASE_URL`:

```bash
npm run db:seed
# or: node seed-campus-data.js
```

It expects the seven demo accounts listed above to exist already. Do not run
`prisma/seed.js` against a database containing data; that legacy script is
destructive. Never use `prisma migrate reset` on a database with data.

### Render + Vercel deployment

1. Create a Render PostgreSQL database and a Render Web Service using `backend/`
   as its root directory. Use `npm install` for the build command and `npm start`
   for the start command.
2. Set these backend environment variables in Render:
   - `DATABASE_URL`: Render PostgreSQL connection string.
   - `JWT_SECRET`: long, private random secret.
   - `CORS_ORIGIN`: exact deployed Vercel frontend origin (for example,
     `https://your-campus-app.vercel.app`).
   - `TIMEZONE`: `Asia/Kolkata`.
   - `NODE_ENV`: `production`.
   - `PORT`: Render supplies this automatically; set only if required.
3. Deploy the `frontend/` directory to Vercel. Set
   `VITE_API_BASE_URL` to the deployed Render API URL ending in `/api`, for
   example `https://your-campus-api.onrender.com/api`, then redeploy.
4. Apply schema changes only after backing up the PostgreSQL database. Do not
   run the legacy seed script or `prisma migrate reset` on production data.

### Booking limits and blackout dates

Administrators can create/update the `blackout_dates` system setting through
`PUT /api/admin/settings`, for example
`{"key":"blackout_dates","value":"2026-12-25,2027-01-01"}`. Dates must be
comma-separated `YYYY-MM-DD` values. Booking and rescheduling requests on those
dates are rejected with a message shown in the booking UI.

Approved bookings can be downloaded as `.ics` at
`GET /api/bookings/:id/ics` by the owner or an admin. Admins can download
`GET /api/admin/export/bookings.csv`; optional inclusive `from` and `to`
`YYYY-MM-DD` query parameters filter the exported dates. The CSV includes the
booking code, user and email, resource, date, start/end times, status, estimated
kWh, and eco score.

---

## 🧪 Running Automated End-to-End Tests

To verify all backend APIs, authentication roles, booking overlap checks, rescheduling, and admin approval workflows automatically:

```bash
cd backend
node verify_e2e.js
```

**Test Output:**
```
====================================================
🧪 RUNNING COMPREHENSIVE END-TO-END SYSTEM VERIFICATION
====================================================
1. Health Check: healthy
2. Testing Authentication:
✓ Admin Login Success: Mamta (ADMIN)
✓ Student Login Success: Monisha (STUDENT)
✓ Registration with Role Success: Dr. Verification (Role: FACULTY)
3. Testing Resource Filters:
✓ Total resources: 15 | minCapacity >= 50: 7 resources | AVAILABLE: 14 resources
4. Testing Booking & Conflict Overlap Rule:
✓ Successfully blocked exact overlap (409 Conflict): Resource already booked
✓ Successfully blocked partial overlap (409 Conflict): Resource already booked
✓ Successfully blocked invalid end <= start (400 Bad Request)
✓ Successfully blocked past date (400 Bad Request)
5. Testing Reschedule Booking API:
✓ Reschedule Success to new slot; returns to PENDING status
6. Testing Admin Approval Workflow:
✓ Admin Approval Success; status transitions to APPROVED
7. Testing Admin Analytics:
✓ Overview Metrics & Utilization Distribution calculated
8. Testing In-App Notifications:
✓ Notifications generated and fetched
====================================================
🎉 ALL SYSTEM API & LOGIC VERIFICATIONS PASSED 100%!
====================================================
```

---

## 🛡️ Double-Booking Overlap Algorithm

The system prevents resource double-booking using the mathematical interval overlap theorem:

$$\text{Conflict} \iff (\text{Existing Start} < \text{New End}) \land (\text{Existing End} > \text{New Start})$$

Prisma Query Implementation:
```javascript
const overlappingBookings = await prisma.booking.findMany({
  where: {
    resourceId,
    date,
    id: { not: currentBookingId }, // Excluded when rescheduling
    status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] },
    AND: [
      { startTime: { lt: newEndTime } },
      { endTime: { gt: newStartTime } }
    ]
  }
});
```

If a conflict is detected, the API returns `409 Conflict` with exact conflicting time bounds:
`"Resource already booked from 10:00 to 12:00 on 2026-11-20."`

---

© 2026 Campus Resource Management and Allocation System. All rights reserved.
