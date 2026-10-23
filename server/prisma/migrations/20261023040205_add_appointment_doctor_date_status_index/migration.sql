-- CreateIndex
CREATE INDEX "idx_appointment_doctor_date_status" ON "Appointment"("doctorId", "appointmentDate", "status");
