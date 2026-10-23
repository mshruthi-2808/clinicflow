import prisma from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import { assertTransition } from '../services/appointmentStateMachine.js';
import { formatDateOnly, getTodayDateString } from '../utils/dateTime.js';
import { recordQueueEvent, QUEUE_EVENT_TYPES } from '../events/queueEvents.js';

export const queueRepository = {
  /**
   * Check in an appointment with retry on token number collision (up to 3 times)
   * All check-in steps are executed inside a single transaction.
   */
  checkInWithRetry: async (appointmentId, maxRetries = 15) => {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        return await prisma.$transaction(async (tx) => {
          // 1. Load appointment
          const appointment = await tx.appointment.findUnique({
            where: { id: appointmentId },
            include: { doctor: true },
          });

          if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', 'Appointment not found');
          }

          // 2. Reject duplicate check-in if patient is already checked in or has a QueueEntry
          const existingEntry = await tx.queueEntry.findUnique({
            where: { appointmentId },
          });

          if (existingEntry || appointment.status === 'CHECKED_IN') {
            throw new AppError(409, 'ALREADY_CHECKED_IN', 'This patient is already checked in');
          }

          // 3. Assert transition BOOKED -> CHECKED_IN
          assertTransition(appointment.status, 'CHECKED_IN');

          // 4. Reject if appointment is not for today
          const todayStr = getTodayDateString();
          const aptDateStr = formatDateOnly(appointment.appointmentDate);
          if (aptDateStr !== todayStr) {
            throw new AppError(
              400,
              'INVALID_CHECKIN_DATE',
              `Cannot check in for an appointment on ${aptDateStr}. Check-in is only allowed on the appointment day (${todayStr}).`
            );
          }

          // 5. Compute the next token for that doctor and date as max(tokenNumber) + 1
          const maxTokenAgg = await tx.queueEntry.aggregate({
            where: {
              doctorId: appointment.doctorId,
              queueDate: appointment.appointmentDate,
            },
            _max: {
              tokenNumber: true,
            },
          });

          const nextToken = (maxTokenAgg._max.tokenNumber || 0) + 1;

          // 6. Create QueueEntry (WAITING)
          const queueEntry = await tx.queueEntry.create({
            data: {
              appointmentId,
              doctorId: appointment.doctorId,
              queueDate: appointment.appointmentDate,
              tokenNumber: nextToken,
              status: 'WAITING',
              checkedInAt: new Date(),
            },
          });

          // 7. Update appointment status to CHECKED_IN
          const updatedAppointment = await tx.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CHECKED_IN' },
            include: { doctor: true },
          });

          // 8. Record QueueEvent INSIDE the exact same database transaction
          await recordQueueEvent(tx, {
            type: QUEUE_EVENT_TYPES.CHECKED_IN,
            doctorId: appointment.doctorId,
            appointmentId,
            tokenNumber: nextToken,
            details: {
              patientName: appointment.patientName,
              slotStart: appointment.slotStart,
              checkedInAt: queueEntry.checkedInAt,
            },
          });

          // Return consistent response with no schedule and no nested duplicate appointment
          return {
            queueEntry: {
              id: queueEntry.id,
              tokenNumber: queueEntry.tokenNumber,
              status: queueEntry.status,
              checkedInAt: queueEntry.checkedInAt,
            },
            appointment: {
              id: updatedAppointment.id,
              patientName: updatedAppointment.patientName,
              appointmentDate: formatDateOnly(updatedAppointment.appointmentDate),
              slotStart: updatedAppointment.slotStart,
              status: updatedAppointment.status,
              doctorName: updatedAppointment.doctor.name,
            },
          };
        });
      } catch (err) {
        // If unique constraint hit on appointmentId (already checked in)
        if (
          err.code === 'P2002' &&
          (err.meta?.target?.includes('appointmentId') || String(err.meta?.target).includes('appointmentId'))
        ) {
          throw new AppError(409, 'ALREADY_CHECKED_IN', 'This patient is already checked in');
        }

        // If unique constraint hit on (doctorId, queueDate, tokenNumber), retry
        if (err.code === 'P2002' && attempts < maxRetries - 1) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 20 + 5)));
          continue;
        }
        throw err;
      }
    }
  },

  /**
   * Retrieves live queue for a doctor on a specific date using a CTE and ROW_NUMBER window function.
   * Parameterized via Prisma.$queryRaw.
   */
  getDoctorLiveQueue: async (doctorId, dateObj) => {
    const rows = await prisma.$queryRaw`
      WITH waiting_ranked AS (
        SELECT 
          qe.id,
          ROW_NUMBER() OVER (
            PARTITION BY qe."doctorId" 
            ORDER BY qe."tokenNumber" ASC
          )::int AS position
        FROM "QueueEntry" qe
        WHERE qe."doctorId" = ${doctorId}
          AND qe."queueDate" = ${dateObj}::date
          AND qe.status = 'WAITING'::"QueueStatus"
      )
      SELECT 
        qe.id AS "queueEntryId",
        qe."appointmentId",
        qe."doctorId",
        qe."queueDate",
        qe."tokenNumber",
        qe.status,
        qe."checkedInAt",
        qe."calledAt",
        qe."completedAt",
        a."patientName",
        a."patientPhone",
        a.reason,
        a."slotStart",
        wr.position
      FROM "QueueEntry" qe
      JOIN "Appointment" a ON a.id = qe."appointmentId"
      LEFT JOIN waiting_ranked wr ON wr.id = qe.id
      WHERE qe."doctorId" = ${doctorId}
        AND qe."queueDate" = ${dateObj}::date
      ORDER BY 
        CASE 
          WHEN qe.status = 'IN_CONSULTATION'::"QueueStatus" THEN 1
          WHEN qe.status = 'WAITING'::"QueueStatus" THEN 2
          WHEN qe.status = 'COMPLETED'::"QueueStatus" THEN 3
          WHEN qe.status = 'SKIPPED'::"QueueStatus" THEN 4
          ELSE 5
        END ASC,
        qe."tokenNumber" ASC;
    `;

    return rows;
  },

  /**
   * Finds QueueEntry by appointment ID
   */
  findByAppointmentId: async (appointmentId) => {
    return prisma.queueEntry.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            doctor: true,
          },
        },
        doctor: true,
      },
    });
  },

  /**
   * Finds QueueEntry by ID
   */
  findById: async (id) => {
    return prisma.queueEntry.findUnique({
      where: { id },
      include: {
        appointment: true,
        doctor: true,
      },
    });
  },

  /**
   * Finds the patient currently in consultation with a doctor on a specific date
   */
  findCurrentInConsultation: async (doctorId, dateObj) => {
    return prisma.queueEntry.findFirst({
      where: {
        doctorId,
        queueDate: dateObj,
        status: 'IN_CONSULTATION',
      },
      include: {
        appointment: true,
      },
    });
  },

  /**
   * Computes position of a single waiting token for a doctor on a date
   */
  getWaitingPositionForToken: async (doctorId, dateObj, tokenNumber) => {
    const countAhead = await prisma.queueEntry.count({
      where: {
        doctorId,
        queueDate: dateObj,
        status: 'WAITING',
        tokenNumber: {
          lt: tokenNumber,
        },
      },
    });

    return countAhead + 1; // 1-indexed position
  },

  /**
   * Staff calls next patient: picks lowest-token WAITING entry and sets IN_CONSULTATION
   */
  callNext: async (doctorId, dateObj) => {
    return prisma.$transaction(async (tx) => {
      // 1. Reject if doctor already has someone in consultation
      const busy = await tx.queueEntry.findFirst({
        where: {
          doctorId,
          queueDate: dateObj,
          status: 'IN_CONSULTATION',
        },
        include: {
          appointment: true,
        },
      });

      if (busy) {
        throw new AppError(
          409,
          'DOCTOR_ALREADY_BUSY',
          `Doctor currently has token #${busy.tokenNumber} (${busy.appointment.patientName}) in consultation`
        );
      }

      // 2. Pick lowest-token WAITING entry
      const nextEntry = await tx.queueEntry.findFirst({
        where: {
          doctorId,
          queueDate: dateObj,
          status: 'WAITING',
        },
        orderBy: {
          tokenNumber: 'asc',
        },
        include: {
          appointment: true,
          doctor: true,
        },
      });

      if (!nextEntry) {
        throw new AppError(409, 'QUEUE_EMPTY', 'No patients currently waiting in the queue for this doctor');
      }

      // 3. Assert transition on appointment: CHECKED_IN -> IN_CONSULTATION
      assertTransition(nextEntry.appointment.status, 'IN_CONSULTATION');

      const now = new Date();

      // 4. Update QueueEntry to IN_CONSULTATION
      const updatedQueueEntry = await tx.queueEntry.update({
        where: { id: nextEntry.id },
        data: {
          status: 'IN_CONSULTATION',
          calledAt: now,
        },
        include: {
          appointment: true,
          doctor: true,
        },
      });

      // 5. Update Appointment to IN_CONSULTATION
      const updatedAppointment = await tx.appointment.update({
        where: { id: nextEntry.appointmentId },
        data: {
          status: 'IN_CONSULTATION',
        },
      });

      // 6. Record QueueEvent INSIDE the exact same database transaction
      await recordQueueEvent(tx, {
        type: QUEUE_EVENT_TYPES.CALLED,
        doctorId,
        appointmentId: nextEntry.appointmentId,
        tokenNumber: nextEntry.tokenNumber,
        details: {
          patientName: nextEntry.appointment.patientName,
          slotStart: nextEntry.appointment.slotStart,
          calledAt: now,
        },
      });

      return {
        queueEntry: updatedQueueEntry,
        appointment: updatedAppointment,
      };
    });
  },

  /**
   * Staff completes consultation: IN_CONSULTATION -> COMPLETED
   */
  completeConsultation: async (entryId) => {
    return prisma.$transaction(async (tx) => {
      const entry = await tx.queueEntry.findUnique({
        where: { id: entryId },
        include: { appointment: true, doctor: true },
      });

      if (!entry) {
        throw new AppError(404, 'NOT_FOUND', 'Queue entry not found');
      }

      if (entry.status !== 'IN_CONSULTATION') {
        throw new AppError(
          409,
          'INVALID_STATUS_TRANSITION',
          `Cannot complete consultation for token #${entry.tokenNumber} because current status is '${entry.status}'. Must be 'IN_CONSULTATION'.`
        );
      }

      assertTransition(entry.appointment.status, 'COMPLETED');

      const now = new Date();

      const updatedQueueEntry = await tx.queueEntry.update({
        where: { id: entryId },
        data: {
          status: 'COMPLETED',
          completedAt: now,
        },
        include: {
          appointment: true,
          doctor: true,
        },
      });

      const updatedAppointment = await tx.appointment.update({
        where: { id: entry.appointmentId },
        data: {
          status: 'COMPLETED',
        },
      });

      // Calculate actual consultation duration in minutes
      const durationMs = entry.calledAt
        ? Math.max(0, now.getTime() - new Date(entry.calledAt).getTime())
        : 0;
      const durationMinutes = entry.calledAt ? Math.max(1, Math.round(durationMs / 60000)) : null;

      // Record QueueEvent (COMPLETED with durationMinutes) INSIDE the exact same database transaction
      await recordQueueEvent(tx, {
        type: QUEUE_EVENT_TYPES.COMPLETED,
        doctorId: entry.doctorId,
        appointmentId: entry.appointmentId,
        tokenNumber: entry.tokenNumber,
        durationMinutes,
        details: {
          patientName: entry.appointment.patientName,
          slotStart: entry.appointment.slotStart,
          calledAt: entry.calledAt,
          completedAt: now,
          durationMinutes,
        },
      });

      return {
        queueEntry: updatedQueueEntry,
        appointment: updatedAppointment,
      };
    });
  },

  /**
   * Staff skips patient: WAITING -> SKIPPED and appointment -> NO_SHOW
   */
  skipPatient: async (entryId) => {
    return prisma.$transaction(async (tx) => {
      const entry = await tx.queueEntry.findUnique({
        where: { id: entryId },
        include: { appointment: true, doctor: true },
      });

      if (!entry) {
        throw new AppError(404, 'NOT_FOUND', 'Queue entry not found');
      }

      if (entry.status !== 'WAITING') {
        throw new AppError(
          409,
          'INVALID_STATUS_TRANSITION',
          `Cannot skip token #${entry.tokenNumber} because current status is '${entry.status}'. Only 'WAITING' patients can be skipped.`
        );
      }

      assertTransition(entry.appointment.status, 'NO_SHOW');

      const updatedQueueEntry = await tx.queueEntry.update({
        where: { id: entryId },
        data: {
          status: 'SKIPPED',
        },
        include: {
          appointment: true,
          doctor: true,
        },
      });

      const updatedAppointment = await tx.appointment.update({
        where: { id: entry.appointmentId },
        data: {
          status: 'NO_SHOW',
        },
      });

      // Record QueueEvent (SKIPPED) INSIDE the exact same database transaction
      await recordQueueEvent(tx, {
        type: QUEUE_EVENT_TYPES.SKIPPED,
        doctorId: entry.doctorId,
        appointmentId: entry.appointmentId,
        tokenNumber: entry.tokenNumber,
        details: {
          patientName: entry.appointment.patientName,
          slotStart: entry.appointment.slotStart,
          skippedAt: new Date(),
        },
      });

      return {
        queueEntry: updatedQueueEntry,
        appointment: updatedAppointment,
      };
    });
  },
};
