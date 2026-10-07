# 🌿 Campus Resource Booking & Management System

> **A Production-Grade, Full-Stack Intelligent Campus Ecosystem** featuring **AI Smart Recommendations**, **QR Check-in with 15-Minute Auto-Release No-Show Protection**, and **Green Campus Eco-Score Energy Analytics**.

---

## 🔐 Individual BIT Accounts

Every person signs in manually with a unique email address and password. Registration requires a `@bitsathy.ac.in` email, a department, and a password with at least eight characters including a letter and a number. Public registration can create Student and Faculty accounts only; administrator accounts must be provisioned by an administrator.

The repeatable database seed records verified Bannari Amman Institute of Technology details, including the official department directory, address and contacts, Learning Centre Digital Library, auditoria, Electronics and Instrumentation Computer Centre, and indoor badminton courts. Source URLs and the latest verification timestamp are stored in `SystemSetting` records.

---

## 🔥 Key Differentiating Novel Features

### 1. 🤖 AI-Based Smart Resource Recommendation
- Multi-criteria weighted scoring algorithm that evaluates capacity match, facility requirements, location, time slot availability, and Eco Score ratings.
- Displays match percentages (e.g. `96% Suitability`) alongside human-readable bullet points explaining **WHY** the resource was recommended (e.g., *"Matches 40-person capacity and consumes 18% less energy than the Auditorium"*).

### 2. 📱 QR Check-In + Auto Release No-Show Engine
- Every approved booking generates a unique encrypted QR digital pass (`QRCodeSVG`).
- **Interactive Check-In Scanner Simulation**: Users scan or click to transition booking state from `APPROVED` to `CHECKED_IN` and `CHECKED_OUT`.
- **Automatic No-Show Worker**: An automated Express background job runs every 60 seconds. If a user fails to check in within the **15-minute grace period** after `startTime`, the system automatically marks the booking as `NO_SHOW`, releases the resource to `AVAILABLE`, notifies the user, and logs an audit record.

### 3. 🍃 Green Campus / Eco Score & Energy Analytics
- Calculates real-time estimated energy consumption (**kWh**) for every reservation based on room power load, attendee occupancy ratio, and HVAC usage.
- Each resource is assigned a dynamic **Eco Score (0-100)**.
- **Executive Energy Dashboard**: Features interactive **Recharts** graphs for monthly energy savings, building consumption breakdowns, and rankings of the greenest vs highest energy-consuming rooms.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React Icons, Recharts, FullCalendar v6, `qrcode.react`.
- **Backend**: Node.js, Express.js REST API, JWT Authentication, bcryptjs password hashing, CORS, `node-cron`.
- **Database**: Prisma ORM with SQLite (`dev.db`), zero external setup required, fully compatible with MySQL.

---

## 📂 Project Structure

```
campus_resource/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Prisma database models
│   │   ├── seed.js                # Seed script (20 users, 15 resources, bookings, etc.)
│   │   └── dev.db                 # Pre-configured SQLite database
│   ├── src/
│   │   ├── config/                # Environment & Prisma client setup
│   │   ├── controllers/           # Auth, Resource, Booking, CheckIn, Admin, Analytics
│   │   ├── middleware/            # JWT auth & RBAC authorization
│   │   ├── services/              # AI Recommendation engine, Eco calculator, No-Show job
│   │   ├── routes/                # REST API routers
│   │   └── server.js              # Express server entry point
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI (Navbar, Sidebar, QRModal, RecommendationCard, EcoBadge, ConflictWarningModal, FeedbackModal)
│   │   ├── context/               # AuthContext & NotificationContext
│   │   ├── layouts/               # DashboardLayout wrapper
│   │   ├── pages/                 # LandingPage, LoginPage, Student/Faculty/Admin Dashboards, SmartBooking, Resources, Calendar, History, Analytics, Maintenance, Profile
│   │   ├── services/              # Axios API client
│   │   ├── App.jsx                # Router & Protected routes
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start Guide (How to Run Locally)

### 1. Start the Backend API Server
```bash
cd C:\Users\mamta\OneDrive\Desktop\campus_resource\backend

# Dependencies & DB setup (already pre-seeded!)
npm install
npx prisma db push
node prisma/seed.js

# Start backend server on port 5000
npm start
```
*Backend API will run at:* `http://localhost:5000/api`

`backend/.env` controls the API port and permitted frontend origin. Copy `backend/.env.example` if you need a fresh configuration.

### 2. Start the Frontend Application
```bash
cd C:\Users\mamta\OneDrive\Desktop\campus_resource\frontend

# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev
```
*Frontend application will run at:* `http://localhost:3000`

The frontend calls `/api` and Vite proxies it to `http://localhost:5000` in development. For another API host, copy `frontend/.env.example` to `frontend/.env` and update `VITE_API_BASE_URL` and `VITE_BACKEND_URL`.

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | User login (returns JWT token & profile) |
| `POST` | `/api/auth/register` | User registration |
| `GET` | `/api/resources` | List all resources with filters (search, building, type, status) |
| `POST` | `/api/bookings/check-availability` | **Double-booking overlap check** |
| `POST` | `/api/bookings/recommend` | **AI Smart Resource Recommendation engine** |
| `POST` | `/api/bookings` | Create booking (calculates kWh & eco score) |
| `POST` | `/api/checkin/scan` | **QR Code Check-In endpoint** |
| `POST` | `/api/checkin/checkout` | Check-Out & release resource |
| `GET` | `/api/analytics/energy` | Green Campus energy analytics & Recharts data |
| `POST` | `/api/maintenance` | Lock resource under maintenance status |

---

## ✅ Evaluation & Testing Flow

1. **Sign In**: Navigate to `http://localhost:3000/login` and enter your individual BIT account credentials.
2. **AI Smart Booking**: Go to **AI Smart Booking**, complete the purpose, date, time range, and attendee count, then click **Run AI Smart Recommendation**.
3. **Double Booking Guard**: Try booking an occupied room for the exact same date & time slot to see the **Conflict Alert Modal**.
4. **QR Check-In**: Go to **My Bookings & QR**, click **View QR & Check-In**, then click **Simulate QR Check-In Scanner**. Notice the status becomes `CHECKED_IN`.
5. **Eco Analytics**: Log in as **Admin** and navigate to **Green Energy Analytics** to view the Recharts graphs.

---

© 2026 Campus Resource Booking & Management System. All rights reserved.
