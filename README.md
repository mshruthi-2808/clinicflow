# ClinicFlow 🩺

> A demo-ready outpatient department (OPD) appointment scheduling, live queue tracking, and wait-time estimation web application built as a college mini project.
>
> 🌐 **Live Production Application**: [https://clinicflow-opd.vercel.app](https://clinicflow-opd.vercel.app)  
> *(Alternative mirror: [https://clinicflow-care.vercel.app](https://clinicflow-care.vercel.app))*

---

## 📌 Project Overview

**ClinicFlow** simplifies outpatient department (OPD) queueing and scheduling for clinics and healthcare centers. It bridges the communication gap between patients and clinic reception by providing:
- **Patient Self-Service**: Real-time slot availability browsing, instant booking, and a live queue tracking dashboard accessible from any mobile or desktop browser without requiring an account.
- **Queue Transparency**: Sequential daily tokens per doctor, live position indicators ("3 patients ahead of you"), and dynamic estimated wait time calculations that adapt to real consultation durations.
- **Staff Reception Desk**: A fast, intuitive demonstration interface for front-desk staff to check in arriving patients, call the next patient into consultation, mark visits completed or skipped, and view real-time clinic throughput statistics.

> [!IMPORTANT]
> **Demonstration Login Notice**: The staff portal and authentication system (`staff@clinicflow.local`) are built strictly as a **college mini project demonstration**. They provide straightforward JWT Bearer authentication for academic evaluation and feature demonstration. They do **not** claim production-grade security, enterprise role-based access control, or HIPAA/GDPR compliance.

---

## 🎯 Key Features

1. **Doctor Discovery & Scheduling**
   - Filter doctors by medical specialisation, name, or day availability.
   - Intelligent slot generation based on doctor weekly schedule JSONB configs (e.g. 09:00 - 13:00, 15-minute intervals).
   - Real-time slot availability check indicating booked vs open slots for any calendar date.
2. **Double-Booking & Race-Condition Prevention**
   - PostgreSQL Partial Unique Index (`uniq_active_slot`) prevents simultaneous double-bookings at the database level.
   - Cancelled appointments immediately release their slot for new bookings.
3. **Live OPD Queue Tracking**
   - Sequential, gap-free token assignment per doctor per day ($1, 2, 3, \dots$).
   - Live queue status page (`/queue/:appointmentId`) with auto-polling every 10 seconds and refetch on window focus.
   - Dynamic estimated wait time calculated using recent doctor consultation averages with fallback to configured slot duration.
4. **Staff Management Console**
   - Fast check-in terminal by appointment ID or patient lookup.
   - Live queue management board with "Call Next", "Complete", and "Skip" actions.
   - Single-query aggregate clinic statistics dashboard.
   - Doctor directory and schedule overview.
5. **Robust Concurrency & Auditability**
   - Atomic database transactions guarantee queue state changes and `QueueEvent` audit records commit or rollback together.
   - Fully automated test suite with 100% pass rate.
   - Concurrency stress test verifying zero double-bookings and gap-free token issuance.

---

## 🛠️ Tech Stack

> [!NOTE]
> **Database Architecture**: ClinicFlow is built **exclusively on PostgreSQL**. It uses relational integrity, partial unique indexes, JSONB columns with GIN indexes, window functions, and ACID transactions. **No NoSQL or MongoDB** databases are used.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Monorepo** | Node.js (Root scripts) | Unified commands for starting, testing, and managing the project |
| **Backend API** | Node.js (ES Modules), Express.js | 4-layer architecture: `routes` &rarr; `controllers` &rarr; `services` &rarr; `repositories` |
| **Database** | **PostgreSQL** (v14+) | Relational database with partial indexes, JSONB, and transaction isolation |
| **ORM** | Prisma ORM (v6.x) | Type-safe query builder, schema migrations, and relational seeding |
| **Frontend SPA** | React 19, Vite | Fast Single Page Application with component-level modularity |
| **Styling** | Tailwind CSS v4, Lucide React | Modern, clean UI design with responsive layouts and loading skeletons |
| **Data Fetching** | TanStack Query v5, Axios | Declarative caching, live auto-polling (refetchInterval), and retry handling |
| **Validation** | Zod (v3.x) | End-to-end schema validation on all inputs, query params, and body payloads |
| **Testing** | Vitest, Supertest | Server automated integration test suite |

---

## 🏛️ Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Frontend SPA (React + Vite)"]
        UI_Patient["Patient Views\n- Doctors & Slots\n- Booking Modal\n- My Appointments\n- Live Queue Tracker (/queue/:id)"]
        UI_Staff["Staff Views (Demo)\n- Staff Login (/staff/login)\n- Queue Board\n- Appointments Table\n- Daily Stats Dashboard"]
        QueryCache["TanStack Query (Axios Client)\n- 10s Queue Polling\n- JWT Bearer Interceptor"]
        UI_Patient --> QueryCache
        UI_Staff --> QueryCache
    end

    subgraph Server["Backend API Server (Express.js)"]
        MW["Security & Middleware\n- Helmet & CORS\n- Express Rate Limiter\n- Zod Request Validators\n- JWT Auth Middleware\n- Central Error Handler"]
        Router["Express Routers\n/api/v1/*"]
        Controllers["Controllers\n(HTTP extraction & responses)"]
        Services["Domain Services\n- appointmentService\n- appointmentStateMachine\n- queueService (CTE wait time)\n- authService"]
        Repos["Repositories (Prisma ORM)\n- doctorRepo\n- appointmentRepo\n- queueRepo\n- statsRepo"]
        
        QueryCache <-->|HTTP / JSON| MW
        MW --> Router --> Controllers --> Services --> Repos
    end

    subgraph DB["PostgreSQL Database"]
        Tables["Relational Tables\n- Doctor & Specialisation\n- Appointment (B-Tree & Partial Unique Index)\n- QueueEntry (Unique Token per Doctor/Day)\n- QueueEvent (Audit Trail + GIN index)\n- StaffUser (Bcrypt hashed)"]
        Repos <-->|Prisma Transactions & Raw SQL| Tables
    end
```

---

## 🗄️ Entity Relationship (ER) Diagram

```mermaid
erDiagram
    SPECIALISATION ||--o{ DOCTOR : "categorises"
    DOCTOR ||--o{ APPOINTMENT : "scheduled for"
    DOCTOR ||--o{ QUEUE_ENTRY : "manages queue for"
    DOCTOR ||--o{ QUEUE_EVENT : "has consultation events"
    APPOINTMENT ||--o| QUEUE_ENTRY : "checked in via (1:1)"
    APPOINTMENT ||--o{ QUEUE_EVENT : "tracks history of"

    SPECIALISATION {
        string id PK
        string name UK
        string description
        datetime createdAt
    }

    DOCTOR {
        string id PK
        string name
        string email UK
        string phone
        string specialisationId FK
        int consultationMinutes
        int slotMinutes
        jsonb schedule "Weekly availability (GIN indexed)"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    APPOINTMENT {
        string id PK
        string doctorId FK
        string patientName
        string patientPhone
        string reason
        date appointmentDate
        string slotStart
        enum status "BOOKED, CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW"
        datetime createdAt
        datetime updatedAt
    }

    QUEUE_ENTRY {
        string id PK
        string doctorId FK
        string appointmentId FK,UK
        int tokenNumber "Unique per doctor per date"
        date queueDate
        enum status "WAITING, IN_CONSULTATION, COMPLETED, SKIPPED"
        datetime checkedInAt
        datetime calledAt
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    QUEUE_EVENT {
        string id PK
        enum type "CHECKED_IN, CALLED, SKIPPED, COMPLETED"
        string doctorId FK
        string appointmentId FK
        int tokenNumber
        int durationMinutes
        jsonb details "GIN indexed event payload"
        datetime createdAt
    }

    STAFF_USER {
        string id PK
        string email UK
        string passwordHash
        string name
        string role "ADMIN, RECEPTIONIST, NURSE"
        datetime createdAt
        datetime updatedAt
    }
```

---

## 📁 Folder Structure

```text
clinicflow/
├── package.json              # Root project scripts (one-command dev, tests, race-test)
├── README.md                 # Master documentation
├── .gitignore                # Root gitignore rules
├── docs/                     # Technical analysis & architecture documentation
│   ├── explain-analyze.md    # PostgreSQL EXPLAIN ANALYZE index optimization benchmark
│   └── transactions.md       # Concurrency, Read Committed isolation & transaction matrix
├── scripts/                  # Automated verification & benchmark scripts
│   ├── benchmark-index.js    # 20k rows EXPLAIN ANALYZE comparison script
│   └── race-test.js          # 10-concurrent booking & check-in stress test
├── server/                   # Express.js REST API
│   ├── package.json          # Server dependencies & scripts
│   ├── .env.example          # Server environment variable template
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma data models, relations, and enums
│   │   ├── seed.js           # Idempotent database seeder with realistic OPD data
│   │   └── migrations/       # Versioned PostgreSQL SQL migrations
│   ├── tests/
│   │   └── api.test.js       # Vitest + Supertest automated API test suite
│   └── src/
│       ├── config/           # env configuration and Prisma client instance
│       ├── controllers/      # Express controllers (HTTP request/response handling)
│       ├── events/           # Queue event dispatcher
│       ├── middleware/       # Auth (JWT), validation (Zod), rate limiter, error handling
│       ├── repositories/     # Data access layer (Prisma isolation)
│       ├── services/         # Core business logic & state machine
│       ├── utils/            # Custom AppError, date-time helpers, response formatters
│       ├── validators/       # Zod input validation schemas
│       ├── app.js            # Express application setup
│       └── server.js         # HTTP server listener
└── client/                   # Vite React SPA
    ├── package.json          # Frontend dependencies & scripts
    ├── .env.example          # Client environment variable template
    ├── vite.config.js        # Vite build & proxy configuration
    ├── index.html            # HTML entry point
    └── src/
        ├── api/              # Axios HTTP client with auth token interceptor
        ├── components/       # Reusable components (Navbar, Footer, Skeleton, Badges, Modals)
        ├── context/          # React contexts (AuthContext, ToastContext)
        ├── hooks/            # Custom TanStack Query hooks (doctors, appointments, queue, stats)
        ├── layouts/          # PatientLayout and StaffLayout (with sidebar navigation)
        └── pages/            # Application pages
            ├── Home.jsx             # Landing page with feature highlights & how it works
            ├── Doctors.jsx          # Doctor listing with search & filters
            ├── DoctorDetail.jsx     # Doctor bio, weekly schedule & slot booking calendar
            ├── MyAppointments.jsx   # Patient appointment lookup by phone & queue links
            ├── QueueTracking.jsx    # Live queue tracking page with token indicator
            ├── StaffLogin.jsx       # Staff demo login portal
            ├── NotFound.jsx         # Graceful 404 error page
            └── staff/               # Protected staff console pages
                ├── StaffDashboard.jsx    # Clinic statistics & today's queue overview
                ├── StaffAppointments.jsx # Filterable appointments data table
                ├── StaffQueue.jsx        # Live queue control board (Call Next, Complete, Skip)
                └── StaffDoctors.jsx      # Doctor management & consultation duration configs
```

---

## 🚀 Setup Steps from a Clean Machine

Follow these step-by-step instructions to clone and run ClinicFlow on any machine with Node.js and PostgreSQL installed.

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **PostgreSQL**: v14.0 or higher (`psql --version`) running on `localhost:5432`

---

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/mshruthi-2808/clinicflow.git
cd clinicflow

# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

---

### Step 2: Create PostgreSQL Database

Open `psql` (or your PostgreSQL client) and create the `clinicflow` database:

```sql
CREATE DATABASE clinicflow;
```

*(If you already have a Postgres user with password, note your connection URI, e.g. `postgresql://postgres:postgres@localhost:5432/clinicflow?schema=public`).*

---

### Step 3: Configure Environment Files

1. **Server environment**:
   ```bash
   cp server/.env.example server/.env
   ```
   Edit `server/.env` with your PostgreSQL database credentials:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinicflow?schema=public"
   PORT=5001
   JWT_SECRET="clinicflow_jwt_secret_dev_demo_key"
   DEFAULT_CONSULT_MINUTES=15
   CLIENT_ORIGIN="http://localhost:5173"
   STAFF_EMAIL="staff@clinicflow.local"
   STAFF_PASSWORD="ClinicStaff123!"
   ```

2. **Client environment**:
   ```bash
   cp client/.env.example client/.env
   ```
   Ensure `client/.env` contains:
   ```env
   VITE_API_URL=http://localhost:5001/api/v1
   ```

---

### Step 4: Run Migrations & Seed the Database

Run the database setup script to apply all schema migrations and populate initial demo data (doctors, specialisations, staff user, and appointments):

```bash
npm run db:reset
```

*Output summary:*
```
Applying migration `20261022055039_init`
Applying migration `20261022055051_add_slot_and_schedule_indexes`
Applying migration `20261022105008_add_queue_event`
Applying migration `20261023040205_add_appointment_doctor_date_status_index`
Database seeded successfully! Total Appointments: 19, Queue Entries: 8, Queue Events: 3
```

---

### Step 5: Start the Application (One-Command)

At the root of the repository, run:

```bash
npm run dev
```

This single command launches both:
- **Backend API**: `http://localhost:5001`
- **Frontend SPA**: `http://localhost:5173`

*(Alternatively, you can run them in separate terminals with `npm run dev:server` and `npm run dev:client`).*

Open `http://localhost:5173` in your browser.

---

## 🔑 Demo Staff Login Credentials

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Clinic Staff** | `staff@clinicflow.local` | `ClinicStaff123!` | `/staff/login` &rarr; `/staff/dashboard` |

> [!NOTE]
> For convenience during academic demonstration, clicking the **"Fill Demo Credentials"** button on the `/staff/login` page auto-fills these credentials.

---

## 🎬 Demo Walkthrough Script

Follow this 5-minute walkthrough to test all features of the application end-to-end:

### Phase 1: Patient Experience (Booking & Live Queue)
1. **Browse Doctors**:
   - Navigate to `http://localhost:5173/doctors`.
   - Filter by "General Medicine" or search for "Dr. Priya Sharma".
   - Click **"Book Appointment"** to view doctor details and schedule.
2. **Select Date & Slot**:
   - Pick tomorrow's date (or any upcoming date).
   - Available time slots are dynamically calculated from the doctor's weekly schedule.
   - Click an available slot (e.g. `10:00`).
3. **Book Appointment**:
   - In the modal, enter patient name (e.g., `Ananya Rao`), phone (`9876543210`), and reason (`Routine health checkup`).
   - Click **"Confirm Appointment"**.
   - A success confirmation appears with the appointment ID.
4. **My Appointments & Live Queue**:
   - Go to `http://localhost:5173/my-appointments`.
   - Enter `9876543210` to view the booked appointment card.
   - Note the **"View status"** button on `BOOKED` appointments, linking to `/queue/:id`.
   - On the queue page, observe the message: *"You have not checked in yet. Please report to the reception desk upon arrival."*

### Phase 2: Staff Experience (Check-in, Calling, and Consultation)
1. **Login as Staff**:
   - Navigate to `http://localhost:5173/staff/login`.
   - Click **"Fill Demo Credentials"** and click **"Sign In to Console"**.
2. **Staff Dashboard & Appointments**:
   - In the sidebar, click **"Appointments"**.
   - Search for `Ananya Rao` or filter by today's date.
3. **Check In Patient**:
   - In the sidebar, click **"Live Queue"**.
   - Select "Dr. Priya Sharma".
   - Check in an appointment to assign a daily sequential token (e.g., Token #7).
4. **Live Patient Queue Sync**:
   - Switch back to the patient's queue tab (`/queue/:appointmentId`).
   - Notice the status immediately changes to **"WAITING"**, showing the assigned Token Number, position in line, patients ahead, and **"Estimated Wait"** time.
5. **Call Next & Complete Consultation**:
   - In the Staff Queue tab, click **"Call Next Patient"**.
   - The patient card moves to **"IN CONSULTATION"**.
   - On the patient's screen, the status banner dynamically turns green: **"YOUR TURN — Please enter Doctor's Consultation Room"**.
   - Staff clicks **"Complete Consultation"**.
   - The queue updates, wait times decrement for remaining patients, and a `QueueEvent` is recorded in PostgreSQL.
6. **Clinic Statistics**:
   - In the sidebar, click **"Dashboard"** to view real-time counts of Waiting, In Consultation, Completed, and Cancelled visits.

---

## 📡 API Endpoint Reference Table

Base URL: `http://localhost:5001/api/v1`

| Method | Path | Authentication | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Service health and database ping | `200` |
| `POST` | `/auth/login` | Public | Staff demo login, returns JWT token | `200`, `400`, `401` |
| `GET` | `/specialisations` | Public | List medical specialisations | `200` |
| `GET` | `/doctors` | Public | Filter doctors by specialisation, search, active status | `200` |
| `GET` | `/doctors/:id` | Public | Get doctor profile by UUID | `200`, `404` |
| `GET` | `/doctors/:id/slots?date=YYYY-MM-DD` | Public | Available and booked slots for a given date | `200`, `400`, `404` |
| `POST` | `/doctors` | Staff (JWT) | Create doctor profile with weekly JSONB schedule | `201`, `400`, `401` |
| `PUT` | `/doctors/:id` | Staff (JWT) | Update doctor profile and consultation minutes | `200`, `400`, `401`, `404` |
| `DELETE` | `/doctors/:id` | Staff (JWT) | Soft delete doctor (`isActive = false`) | `200`, `401`, `404` |
| `POST` | `/appointments` | Public | Book appointment slot (prevents double-booking) | `201`, `400`, `409` |
| `GET` | `/appointments` | Public | Search appointments by patient phone, date, doctor | `200`, `400` |
| `GET` | `/appointments/:id` | Public | Get appointment details by ID | `200`, `404` |
| `PATCH` | `/appointments/:id/cancel` | Public | Cancel appointment (releases slot for rebooking) | `200`, `404`, `409` |
| `POST` | `/queue/check-in` | Staff (JWT) | Check in appointment to issue sequential queue token | `201`, `400`, `401`, `409` |
| `GET` | `/queue/doctor/:doctorId?date=` | Staff (JWT) | Doctor queue with window-function positions & wait times | `200`, `401` |
| `GET` | `/queue/appointment/:appointmentId` | Public | Patient queue view (token, position, estimated wait) | `200`, `404` |
| `POST` | `/queue/doctor/:doctorId/call-next` | Staff (JWT) | Call next waiting patient into consultation | `200`, `400`, `401`, `404` |
| `POST` | `/queue/:entryId/complete` | Staff (JWT) | Complete consultation and record duration | `200`, `400`, `401`, `404` |
| `POST` | `/queue/:entryId/skip` | Staff (JWT) | Skip patient (Queue: SKIPPED, Appointment: NO_SHOW) | `200`, `400`, `401`, `404` |
| `GET` | `/stats?date=` | Public | Single-query aggregate clinic statistics | `200` |
| `GET` | `/stats/doctor-averages` | Public | Average consult minutes computed from `QueueEvent` | `200` |

---

## 🧪 Automated Testing & Verification

ClinicFlow includes comprehensive automated test suites and database stress verification scripts:

### 1. Automated Test Suite (Vitest + Supertest)
Run the 7-case integration test suite:
```bash
npm test
```
**Coverage includes:**
1. **Booking Success**: Valid appointment booking returns HTTP 201 Created.
2. **Booking Conflict**: Concurrent duplicate booking for the same slot returns HTTP 409 Conflict (`SLOT_ALREADY_BOOKED`).
3. **Past-Date Rejection**: Attempted past-date booking returns HTTP 400 Bad Request (`PAST_DATE`).
4. **Invalid Status Transition**: Illegal transition (e.g. cancelling an already `COMPLETED` appointment) returns HTTP 409 Conflict (`INVALID_STATUS_TRANSITION`).
5. **Check-In Token Sequence & Duplicate Check-in Prevention**: Sequential tokens (#1, #2) and duplicate check-in rejected with HTTP 409 Conflict (`ALREADY_CHECKED_IN`).
6. **Call-Next and Complete Flow**: Clean transition from `WAITING` &rarr; `IN_CONSULTATION` &rarr; `COMPLETED`, recording atomic `QueueEvent` audit logs.
7. **Wait Estimate Calculation**: Verifies numeric estimation and estimate disclaimer.

---

### 2. Concurrency & Race Condition Stress Test
Run the concurrency stress test:
```bash
npm run race-test
```
**What it verifies:**
- **Test 1**: 10 simultaneous HTTP `POST /appointments` requests fired concurrently for the exact same slot. Verifies that exactly **1 succeeds (201 Created)** and **9 are rejected (409 Conflict)**, leaving exactly 1 record in PostgreSQL.
- **Test 2**: 10 simultaneous HTTP `POST /queue/check-in` requests fired concurrently. Verifies that all 10 succeed with **strictly unique, consecutive, gap-free token numbers** and all 10 `QueueEvent` rows are committed atomically.

---

### 3. PostgreSQL Query Performance Benchmark (EXPLAIN ANALYZE)
Run the query execution plan benchmark:
```bash
npm run benchmark
```
Seeds 20,000 synthetic appointments into PostgreSQL and executes `EXPLAIN (ANALYZE, BUFFERS)` to compare query performance before and after the composite index `idx_appointment_doctor_date_status`.

---

## 📚 Technical Documentation Links

For deep dives into the database design, concurrency controls, and optimization strategies:
- 📖 [docs/explain-analyze.md](file:///Users/mshruthi/Projects/College/clinicflow/docs/explain-analyze.md): In-depth PostgreSQL execution plan comparison (Bitmap Index Scan vs direct Index Scan) on 20,000 appointment rows.
- 📖 [docs/transactions.md](file:///Users/mshruthi/Projects/College/clinicflow/docs/transactions.md): Detailed analysis of PostgreSQL Read Committed isolation, Prisma interactive transactions, partial unique index mechanics, and retry strategies.

---

## 🛡️ License & Academic Integrity

Built as a college mini project for academic demonstration and learning purposes. Released under the [MIT License](LICENSE).
