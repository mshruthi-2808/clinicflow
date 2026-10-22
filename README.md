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

## 🔑 Seed Staff Credentials

For testing and demonstration, the initial staff user seeded into the database is:
- **Email:** `staff@clinicflow.local`
- **Password:** `ClinicStaff123!` *(or the value specified in your `.env`)*

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
│   │       ├── 20261022055039_init/
│   │       │   └── migration.sql
│   │       └── 20261022055051_add_slot_and_schedule_indexes/
│   │           └── migration.sql
│   └── src/                  # (Phase 2+) routes, controllers, services, repositories
└── client/                   # (Phase 4+) Vite React frontend application
```

---

## 📋 Project Roadmap

- [x] **Phase 1: Database Foundation**
  - Schema design, models, relations, enums
  - Initial migration & handwritten raw SQL partial index migration
  - Idempotent seed script with realistic OPD test data
- [ ] **Phase 2: Authentication & Doctor/Schedule APIs**
  - Staff JWT authentication
  - Public specialisation & doctor listing
  - Slot availability engine based on doctor schedules & bookings
- [ ] **Phase 3: Appointments & Queue Management Engine**
  - Appointment booking with conflict prevention
  - Check-in workflow & daily sequential token generation
  - State machine transition guard (409 Conflict enforcement)
  - Estimated wait-time calculation logic
- [ ] **Phase 4: Client Application (Patient & Staff Views)**
  - Patient appointment booking & live queue tracker
  - Staff queue control board & check-in terminal
  - Clinic statistics and summary metrics
