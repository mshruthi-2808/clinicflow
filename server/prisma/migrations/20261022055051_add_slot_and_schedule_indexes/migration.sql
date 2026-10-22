-- Custom raw SQL migration:
-- 1. Partial unique index on Appointment so a slot cannot be double booked unless the earlier booking was cancelled
CREATE UNIQUE INDEX uniq_active_slot ON "Appointment" ("doctorId", "appointmentDate", "slotStart") WHERE status <> 'CANCELLED';

-- 2. GIN index on Doctor.schedule (JSONB column)
CREATE INDEX idx_doctor_schedule_gin ON "Doctor" USING GIN ("schedule");