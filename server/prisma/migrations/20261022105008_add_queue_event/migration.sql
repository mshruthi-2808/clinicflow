-- CreateEnum
CREATE TYPE "QueueEventType" AS ENUM ('CHECKED_IN', 'CALLED', 'SKIPPED', 'COMPLETED');

-- CreateTable
CREATE TABLE "QueueEvent" (
    "id" TEXT NOT NULL,
    "type" "QueueEventType" NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "tokenNumber" INTEGER NOT NULL,
    "durationMinutes" INTEGER,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueueEvent_doctorId_type_createdAt_idx" ON "QueueEvent"("doctorId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "idx_queue_event_details_gin" ON "QueueEvent" USING GIN ("details");

-- AddForeignKey
ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
