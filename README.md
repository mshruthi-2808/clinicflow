# ClinicFlow 🩺

> A demo-ready clinic appointment, queue management, and waiting-time estimation web application built as a college mini project.

---

## 📌 Project Overview

**ClinicFlow** simplifies outpatient department (OPD) queueing and scheduling for small-to-medium clinics. It enables patients to book appointment slots, check in on arrival, receive sequential queue tokens, and track their estimated waiting time in real time, while providing clinic staff with an operational dashboard.

### 🎯 Scope & Boundaries
- **In Scope:**
  - Online appointment booking with slot availability validation.
  - Patient check-in and sequential daily token generation per doctor.
  - Real-time queue tracking and estimated wait time calculations.
  - Staff management dashboard for calling tokens and updating appointment status.
  - Daily clinic statistics and throughput metrics.
- **Strictly Out of Scope:**
  - Hospital management systems (HMS/EMR).
  - Billing, insurance, and payment processing.
  - Telemedicine, video calls, or patient messaging.
  - Pharmacy or inventory management.
  - AI/ML features.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Monorepo** | `/server` & `/client` | Clean separation between backend API and frontend SPA |
| **Server Runtime** | Node.js (ES Modules) | Plain JavaScript (`"type": "module"`), no TypeScript |
| **Server Framework** | Express.js | Layered: `routes` &rarr; `controllers` &rarr; `services` &rarr; `repositories` |
| **Database** | PostgreSQL | Relational storage with strict relational integrity |
| **ORM** | Prisma ORM | Schema management, type-safe queries, migration tooling |
| **Client Framework** | React (Vite) | Single Page Application (SPA) |
| **Client Routing** | React Router v6 | Client-side routing and layout guards |
| **State & Data Fetching** | TanStack Query & Axios | Server state management and HTTP client |
| **Form Handling** | React Hook Form | High-performance form validation |
| **Styling** | Tailwind CSS | Utility-first CSS |

---

## 🏛️ Architecture & Domain Rules

### 1. Server Layering
To ensure maintainability and separation of concerns, the server follows a strict 4-layer pattern:
```
HTTP Request &rarr; routes &rarr; controllers &rarr; services &rarr; repositories &rarr; PostgreSQL (Prisma)
```
- **Routes**: Define HTTP endpoints, methods, and attach auth/validation middlewares.
- **Controllers**: Handle HTTP request extraction, status codes, and HTTP responses only.
- **Services**: Pure business logic (e.g., state transition validations, queue token generation, wait time calculations).
- **Repositories**: The **only** layer permitted to interact with Prisma ORM / PostgreSQL.

### 2. Appointment Lifecycle & State Machine
Appointments adhere to a strict status lifecycle:

```mermaid
stateDiagram-v2
    [*] --> BOOKED
    BOOKED --> CHECKED_IN : Patient Arrives
    BOOKED --> CANCELLED : Patient/Staff Cancels
    BOOKED --> NO_SHOW : Patient Misses Slot
    CHECKED_IN --> IN_CONSULTATION : Doctor Calls Token
    CHECKED_IN --> CANCELLED : Cancelled After Check-in
    CHECKED_IN --> NO_SHOW : Patient Leaves
    IN_CONSULTATION --> COMPLETED : Consultation Done
    COMPLETED --> [*]
    CANCELLED --> [*]
    NO_SHOW --> [*]
```

- **Allowed Transitions:**
  - `BOOKED` &rarr; `CHECKED_IN`, `CANCELLED`, `NO_SHOW`
  - `CHECKED_IN` &rarr; `IN_CONSULTATION`, `CANCELLED`, `NO_SHOW`
  - `IN_CONSULTATION` &rarr; `COMPLETED`
- Any illegal status change is rejected with **`409 Conflict`**.

### 3. Queue & Token Rules
- Each doctor has an independent queue per calendar day (`queueDate`).
- Token numbers are strictly sequential per doctor per day ($1, 2, 3, \dots$).
- Cancelled appointments immediately free their slot. Enforced at the database level via a **PostgreSQL Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX uniq_active_slot 
  ON "Appointment" ("doctorId", "appointmentDate", "slotStart") 
  WHERE status <> 'CANCELLED';
  ```

### 4. Wait-Time Estimation Formula
Estimated wait times are computed dynamically and clearly labeled as estimates:
$$\text{Estimated Wait (minutes)} = \text{Patients Ahead in Queue} \times \text{Average Consultation Minutes}$$
*(Average consultation time defaults to 15 minutes and is configurable per doctor and via environment variables).*

---

## 🗄️ Database Schema Overview

- **`Specialisation`**: Medical departments (e.g., General Medicine, Pediatrics, Dermatology).
- **`Doctor`**: Doctor profile, consultation/slot duration, active status, and JSONB weekly availability schedule (indexed with a GIN index: `idx_doctor_schedule_gin`).
- **`Appointment`**: Patient appointment details, date, slot time, and current status.
- **`QueueEntry`**: Check-in record linked 1:1 with an appointment, tracking daily token number, timestamps (`checkedInAt`, `calledAt`, `completedAt`), and queue status (`WAITING`, `IN_CONSULTATION`, `COMPLETED`, `SKIPPED`).
- **`StaffUser`**: Clinic front-desk personnel with bcrypt-hashed credentials.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or newer, v20+ recommended)
- **PostgreSQL** (v14+ running locally or remotely)
- **npm** (v9+)

---

### Backend Setup (`/server`)

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Configure your database credentials and application settings in `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/clinicflow?schema=public"
   PORT=5000
   JWT_SECRET="your_jwt_secret_key"
   DEFAULT_CONSULT_MINUTES=15
   STAFF_EMAIL="staff@clinicflow.local"
   STAFF_PASSWORD="ClinicStaff123!"
   ```

4. **Run database migrations**:
   Apply the Prisma migrations (including the initial schema and handwritten partial unique index):
   ```bash
   npm run db:migrate
   ```

5. **Seed the database**:
   Populate initial fictional data (6 specialisations, 5 doctors with schedules, 1 staff user, and ~17 appointments across all statuses):
   ```bash
   npm run db:seed
   ```

6. **Reset database (optional)**:
   To completely wipe, re-run all migrations, and re-seed:
   ```bash
   npm run db:reset
   ```

---

## 🔍 Database Verification

You can verify that the custom database indexes are active using `psql`:

### 1. Verify Partial Unique Index (Slot Availability)
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Appointment' AND indexname = 'uniq_active_slot';
```
*Expected output: `... WHERE (status <> 'CANCELLED'::"AppointmentStatus")`*

### 2. Verify Doctor Schedule GIN Index
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Doctor' AND indexname = 'idx_doctor_schedule_gin';
```
*Expected output: `CREATE INDEX idx_doctor_schedule_gin ON public."Doctor" USING gin (schedule)`*

---

## 🔑 Demo Staff Area & Credentials

> [!NOTE]
> **Demo Staff Notice**: The staff authentication area (`/api/v1/auth/login`) and protected staff doctor management endpoints are provided for demonstrative and evaluation purposes for this college mini-project. It uses a straightforward JWT Bearer token mechanism with no complex multi-role or session logic.

For testing and demonstration, the initial staff user seeded into the database is:
- **Email:** `staff@clinicflow.local`
- **Password:** `ClinicStaff123!` *(or the value configured in `.env`)*

---

## 📡 API Endpoints (v1)

Base URL: `http://localhost:5001/api/v1`

### Standard Response Format
- **Success:**
  ```json
  { "success": true, "data": { ... }, "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 } }
  ```
- **Error:**
  ```json
  { "success": false, "error": { "code": "ERROR_CODE", "message": "Detailed message" } }
  ```

### Endpoints Overview
| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Service health status |
| `POST` | `/auth/login` | Public | Staff demo login, returns JWT token |
| `GET` | `/specialisations` | Public | List medical specialisations |
| `GET` | `/doctors` | Public | List doctors with filtering, sorting, pagination |
| `GET` | `/doctors/:id` | Public | Get doctor profile by ID |
| `GET` | `/doctors/:id/slots?date=YYYY-MM-DD` | Public | Get availability slots for a doctor on a given date |
| `POST` | `/doctors` | Staff (JWT) | Create doctor profile |
| `PUT` | `/doctors/:id` | Staff (JWT) | Update doctor profile |
| `DELETE` | `/doctors/:id` | Staff (JWT) | Soft delete doctor (`isActive = false`) |
| `POST` | `/appointments` | Public | Book a new appointment slot |
| `GET` | `/appointments` | Public | Search and list appointments |
| `GET` | `/appointments/:id` | Public | Get appointment details by ID |
| `PATCH` | `/appointments/:id/cancel` | Public | Cancel appointment (releases slot) |
| `POST` | `/queue/check-in` | Staff (JWT) | Check in appointment to issue queue token |
| `GET` | `/queue/doctor/:doctorId?date=` | Staff (JWT) | Live doctor queue with CTE window function positions & wait times |
| `GET` | `/queue/appointment/:appointmentId` | Public | Patient's queue view (token, status, position, patients ahead, estimated wait) |
| `POST` | `/queue/doctor/:doctorId/call-next` | Staff (JWT) | Call lowest-token waiting patient into consultation |
| `POST` | `/queue/:entryId/complete` | Staff (JWT) | Complete consultation for active queue entry |
| `POST` | `/queue/:entryId/skip` | Staff (JWT) | Skip waiting patient (Queue: SKIPPED, Appointment: NO_SHOW) |
| `GET` | `/stats?date=` | Public | Clinic statistics (total, waiting, in consultation, completed, cancelled, no-show) |

---

## 🧪 Testing Phase 3 with cURL (Queue Engine Demo)

Run these curl commands to demonstrate patient check-in, live queue positions, calling patients, completing consultations, and duplicate prevention.

### Step 0: Get Staff JWT Token
```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@clinicflow.local","password":"ClinicStaff123!"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
```

### Step 1: Check in 3 Patients for Today
```bash
# Check in Patient 1 (Manish Gupta)
curl -s -X POST http://localhost:5001/api/v1/queue/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"appointmentId":"40000000-0000-0000-0000-000000000006"}'

# Check in Patient 2 (Ramesh Kumar)
curl -s -X POST http://localhost:5001/api/v1/queue/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"appointmentId":"40000000-0000-0000-0000-000000000018"}'

# Check in Patient 3 (Priya Varma)
curl -s -X POST http://localhost:5001/api/v1/queue/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"appointmentId":"40000000-0000-0000-0000-000000000019"}'
```
*Response shape (clean object with updated status and doctorName only):*
```json
{
  "success": true,
  "data": {
    "queueEntry": {
      "id": "...",
      "tokenNumber": 6,
      "status": "WAITING",
      "checkedInAt": "2026-10-22T07:09:12.214Z"
    },
    "appointment": {
      "id": "40000000-0000-0000-0000-000000000006",
      "patientName": "Manish Gupta",
      "appointmentDate": "2026-10-22",
      "slotStart": "10:15",
      "status": "CHECKED_IN",
      "doctorName": "Dr. Priya Sharma"
    }
  }
}
```

### Step 2: Attempt Duplicate Check-in (Rejected with 409)
Run the exact same check-in command again:
```bash
curl -s -X POST http://localhost:5001/api/v1/queue/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"appointmentId":"40000000-0000-0000-0000-000000000006"}'
```
*Response (HTTP 409):*
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "This patient is already checked in"
  }
}
```

### Step 3: View Live Doctor Queue (Staff Protected)
View Dr. Priya Sharma's queue (`20000000-0000-0000-0000-000000000001`):
```bash
curl -s "http://localhost:5001/api/v1/queue/doctor/20000000-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: View Patient's Own Queue Status (Public)
Patient only needs their appointment ID:
```bash
curl -s "http://localhost:5001/api/v1/queue/appointment/40000000-0000-0000-0000-000000000006"
```
*Output (Returns only that patient's own metrics, no PII or phone numbers):*
```json
{
  "success": true,
  "data": {
    "token": 6,
    "status": "WAITING",
    "position": 3,
    "patientsAhead": 2,
    "estimatedWaitMinutes": 45,
    "isEstimate": true,
    "disclaimer": "Estimated wait time is approximate and may vary depending on patient consultation needs."
  }
}
```
*Note the current patient `IN_CONSULTATION`, the ordered `WAITING` patients with `position: 1, 2, ...`, and `estimatedWaitMinutes` labeled as an estimate.*

### Step 4: Complete the Current Consultation
Complete the consultation for the patient currently inside:
```bash
# Complete Rahul Nair (token 3)
curl -X POST http://localhost:5001/api/v1/queue/5c55676b-5540-4b5e-aad2-8bc65e4bd830/complete \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Call Next Patient
Call the next lowest-token waiting patient:
```bash
curl -X POST http://localhost:5001/api/v1/queue/doctor/8db9ad70-e2a0-49c2-ad32-410e50261ac1/call-next \
  -H "Authorization: Bearer $TOKEN"
```
*Picks token #4 (Pooja Hegde), marks status `IN_CONSULTATION`, and sets `calledAt`.*

### Step 6: Verify Updated Queue Positions and Wait Times
Inspect the live queue again:
```bash
curl -s "http://localhost:5001/api/v1/queue/doctor/8db9ad70-e2a0-49c2-ad32-410e50261ac1"
```
*Notice all waiting patient positions and estimated wait times automatically decrement!*

### Step 7: Check Clinic Statistics
```bash
curl -s http://localhost:5001/api/v1/stats
```
*Response: Single-query aggregation of today's totalAppointments, waiting, inConsultation, completed, cancelled, and noShow counts.*

---

## 📁 Repository Structure

```text
clinicflow/
├── README.md                 # Project documentation
├── .gitignore                # Root gitignore (.env, node_modules)
├── server/
│   ├── .env.example          # Sample environment variables
│   ├── .env                  # Environment variables (gitignored)
│   ├── package.json          # Server dependencies and scripts
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma data models, relations & constraints
│   │   ├── seed.js           # Re-runnable database seeder
│   │   └── migrations/       # SQL migration history
│   └── src/
│       ├── config/           # env configuration and PrismaClient singleton
│       ├── utils/            # AppError, response helpers, dateTime utils
│       ├── events/           # Queue events module (recordQueueEvent)
│       ├── middleware/       # Zod validator, JWT auth, rateLimiter, errorHandler, 404
│       ├── repositories/     # Database queries (Prisma isolation layer)
│       ├── services/         # Business logic and appointment state machine
│       ├── controllers/      # HTTP request and response handlers
│       ├── validators/       # Zod request validation schemas
│       ├── routes/           # Express API v1 route definitions
│       ├── app.js            # Express app configuration
│       └── server.js         # HTTP server entry point
└── client/                   # (Phase 4) Vite React frontend application
```

---

## 📋 Project Roadmap

- [x] **Phase 1: Database Foundation**
  - Schema design, models, relations, enums
  - Initial migration & handwritten raw SQL partial index migration
  - Idempotent seed script with realistic OPD test data
- [x] **Phase 2: Backend API for Doctors & Appointments**
  - Express app with CORS, Helmet, Rate Limiting, Central Error Handling
  - Zod validation for body, params, and query
  - Public specialisations, doctors, and slot availability calculation
  - Appointment booking with conflict prevention and slot freeing on cancellation
  - Strict appointment state machine transition enforcement (assertTransition 409)
  - Staff demo JWT authentication and protected doctor management
- [x] **Phase 3: Appointments & Queue Management Engine**
  - Patient check-in workflow with token concurrency retry (max 3)
  - Live queue tracking with raw SQL CTE window function for positions
  - Dynamic estimated wait time calculation (patientsAhead x avg + remaining in consultation)
  - Patient own queue status view with estimate disclaimer
  - Staff queue operations (call-next, complete, skip)
  - Queue event recording stub
  - Clinic statistics single-query aggregation
- [ ] **Phase 4: Client Application (Patient & Staff Views)**
  - Patient appointment booking & live queue tracker
  - Staff queue control board & check-in terminal
  - Clinic statistics and summary metrics


