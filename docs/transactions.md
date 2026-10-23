# Database Concurrency, Transactions & Isolation in ClinicFlow

## 1. PostgreSQL Isolation Level Overview
ClinicFlow runs on PostgreSQL using the default **Read Committed** isolation level with Prisma interactive transactions (`prisma.$transaction(async (tx) => { ... })`).

Under Read Committed:
* Each SQL statement inside a transaction sees a snapshot of the database taken at the start of that statement (not at the start of the transaction).
* A transaction never reads uncommitted dirty data (`READ COMMITTED` guarantee).
* If a transaction attempts to modify a row currently locked by another uncommitted transaction, it pauses and waits until the first transaction either commits or rolls back.

By pairing Read Committed isolation with PostgreSQL database-level constraints (partial unique indexes, foreign keys) and application-level retry loops, ClinicFlow achieves strict ACID consistency, gap-free token generation, and double-booking prevention without requiring the performance overhead of `SERIALIZABLE` isolation or table-level locks.

---

## 2. Operations & Concurrency Protection Matrix

### A. Appointment Booking: Double-Booking Prevention
* **Protected Operation**: `POST /api/v1/appointments`
* **Underlying Constraint**:
  ```sql
  CREATE UNIQUE INDEX uniq_active_slot 
  ON "Appointment" ("doctorId", "appointmentDate", "slotStart") 
  WHERE status <> 'CANCELLED';
  ```
* **Concurrency Mechanism**:
  When multiple patients attempt to book the exact same slot concurrently, both transactions execute `INSERT INTO "Appointment"`. PostgreSQL's B-Tree unique index enforcement inspects the active slot index:
  1. The first transaction to reach the index gains the entry.
  2. The concurrent transaction waits on the first transaction's row-level lock.
  3. When the first transaction commits, PostgreSQL immediately rejects the second transaction with error code `23505` (unique violation), mapped by Prisma to error code `P2002`.
  4. The application catches `P2002` and returns a clean `409 Conflict` (`SLOT_ALREADY_BOOKED`).
  5. Cancelled appointments have `status = 'CANCELLED'`, which excludes them from the partial index predicate `WHERE status <> 'CANCELLED'`, allowing previously cancelled slots to be freely rebooked.

---

### B. Queue Desk Check-In: Gap-Free Sequential Token Assignment
* **Protected Operation**: `POST /api/v1/queue/check-in`
* **Underlying Constraints**:
  1. `QueueEntry.appointmentId` (`@unique`): Guarantees that a patient cannot be checked in more than once.
  2. `QueueEntry` composite unique constraint:
     ```sql
     @@unique([doctorId, queueDate, tokenNumber])
     ```
* **Concurrency Mechanism & Retry Loop**:
  Token numbers must be strictly sequential, unique, and gap-free for each doctor's daily OPD queue.
  1. Inside `prisma.$transaction`, the application computes the next candidate token:
     ```javascript
     const maxTokenAgg = await tx.queueEntry.aggregate({
       where: { doctorId, queueDate },
       _max: { tokenNumber: true },
     });
     const nextToken = (maxTokenAgg._max.tokenNumber || 0) + 1;
     ```
  2. When 10 patients check in simultaneously for the same doctor, all 10 may initially observe the same baseline maximum and attempt to insert `tokenNumber = N`.
  3. PostgreSQL guarantees that exactly one transaction succeeds; the remaining concurrent transactions fail the composite unique constraint `(doctorId, queueDate, tokenNumber)`.
  4. The repository catches the `P2002` constraint error and triggers an automatic retry (up to 15 attempts) with randomized jitter (`Math.floor(Math.random() * 20 + 5) ms`).
  5. On retry, each transaction reads the newly committed maximum token and claims the next sequential number ($N+1, N+2, \dots$) until all check-ins succeed with unique, gap-free tokens.

---

### C. Atomic Audit Trail: QueueEvent In-Transaction Recording
* **Protected Operations**: `checkIn`, `callNext`, `completeConsultation`, `skipPatient`
* **Underlying Model**: `QueueEvent` (`CHECKED_IN`, `CALLED`, `SKIPPED`, `COMPLETED`)
* **Design Choice & Atomicity Guarantee**:
  Every `QueueEvent` record is inserted via `recordQueueEvent(tx, { ... })` **INSIDE** the exact same `prisma.$transaction` as the queue state change.
  Because both the operational tables (`QueueEntry`, `Appointment`) and the audit log (`QueueEvent`) live in the same PostgreSQL database, they commit or roll back together as a single atomic unit of work:
  * If the consultation completion succeeds, both the `QueueEntry.status = 'COMPLETED'` update and the `QueueEvent` (with calculated `durationMinutes`) commit simultaneously.
  * If an unhandled exception or constraint violation occurs, PostgreSQL rolls back both changes completely.
  * This eliminates orphan audit events and state desynchronization without needing distributed two-phase commit (2PC) or an external outbox worker.

---

### D. Consultation Room Mutual Exclusion (`callNext`)
* **Protected Operation**: `POST /api/v1/queue/call-next`
* **Concurrency Mechanism**:
  Before calling the next waiting patient into a doctor's room, the transaction verifies that the room is vacant:
  ```javascript
  const busy = await tx.queueEntry.findFirst({
    where: { doctorId, queueDate, status: 'IN_CONSULTATION' },
    include: { appointment: true },
  });
  if (busy) {
    throw new AppError(409, 'DOCTOR_ALREADY_BUSY', `...`);
  }
  ```
  If another staff member has already called a patient into the room, concurrent calls are rejected with `409 DOCTOR_ALREADY_BUSY`.

---

## 3. Connection Pooling Note (`connection_limit` in `DATABASE_URL`)

Prisma manages client connections to PostgreSQL through an internal connection pool hosted inside its query engine. By default, Prisma sizes the pool according to the formula:
$$\text{pool\_size} = (\text{num\_physical\_cpus} \times 2) + 1$$

In environments with high incoming traffic or multiple application instances (such as horizontal scaling or serverless environments), unconstrained connection growth can quickly overwhelm PostgreSQL's server-wide `max_connections` ceiling, resulting in `FATAL: remaining connection slots are reserved for non-replication superuser connections` errors.

To configure and enforce connection pooling limits, append the `connection_limit` query parameter (and optional `pool_timeout`) directly to `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/clinicflow?connection_limit=10&pool_timeout=20"
```
* **`connection_limit=10`**: Restricts this Node.js process to a maximum of 10 concurrent active PostgreSQL socket connections.
* **`pool_timeout=20`**: Directs Prisma to wait up to 20 seconds for an available pool slot before throwing a timeout error if all 10 connections are saturated.
* In high-throughput production environments with hundreds of concurrent workers, pairing this setting with an external connection pooler like **PgBouncer** or AWS RDS Proxy allows thousands of client transactions to multiplex over a small, cache-friendly pool of physical backend database connections.
