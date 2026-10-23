import prisma from '../config/prisma.js';
import { queueRepository } from '../repositories/queueRepository.js';
import { doctorRepository } from '../repositories/doctorRepository.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { AppError } from '../utils/appError.js';
import { config } from '../config/env.js';
import { parseDateOnly, getTodayDateString, formatDateOnly } from '../utils/dateTime.js';

export const queueService = {
  /**
   * Average consultation minutes function.
   * Uses a CTE on COMPLETED QueueEvent records from the last 7 days.
   * Falls back to the doctor's configured consultationMinutes when fewer than 3 completed.
   * @param {string} doctorId
   * @returns {Promise<number>}
   */
  getAverageConsultMinutes: async (doctorId) => {
    const rows = await prisma.$queryRaw`
      WITH recent_completed AS (
        SELECT "durationMinutes"
        FROM "QueueEvent"
        WHERE "doctorId" = ${doctorId}
          AND type = 'COMPLETED'::"QueueEventType"
          AND "createdAt" >= NOW() - INTERVAL '7 days'
          AND "durationMinutes" IS NOT NULL
      )
      SELECT 
        COUNT(*)::int AS count,
        ROUND(AVG("durationMinutes"))::int AS "avgMinutes"
      FROM recent_completed;
    `;

    const stats = rows && rows[0];
    if (stats && stats.count >= 3 && stats.avgMinutes !== null && stats.avgMinutes !== undefined) {
      return Number(stats.avgMinutes);
    }

    const doctor = await doctorRepository.findById(doctorId);
    return doctor?.consultationMinutes || config.defaultConsultMinutes || 15;
  },

  /**
   * Computes remaining minutes for the patient currently in consultation (if any)
   */
  getRemainingInConsultationMinutes: (currentInConsultation, averageMinutes) => {
    if (!currentInConsultation || !currentInConsultation.calledAt) {
      return 0;
    }
    const elapsedMs = Math.max(0, Date.now() - new Date(currentInConsultation.calledAt).getTime());
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
    return Math.max(0, averageMinutes - elapsedMinutes);
  },

  /**
   * Check in an appointment to generate a daily queue token (staff only)
   * QueueEvent is atomically recorded within the database transaction in queueRepository.
   */
  checkIn: async (appointmentId) => {
    return queueRepository.checkInWithRetry(appointmentId);
  },

  /**
   * Retrieves the live queue for a specific doctor on a given date
   */
  getDoctorQueue: async (doctorId, dateString) => {
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new AppError(404, 'NOT_FOUND', 'Doctor not found');
    }

    const dateStr = dateString || getTodayDateString();
    const dateObj = parseDateOnly(dateStr);

    const avgMinutes = await queueService.getAverageConsultMinutes(doctorId);
    const inConsultationEntry = await queueRepository.findCurrentInConsultation(doctorId, dateObj);
    const remainingMinutes = queueService.getRemainingInConsultationMinutes(inConsultationEntry, avgMinutes);

    const rows = await queueRepository.getDoctorLiveQueue(doctorId, dateObj);

    const entries = rows.map((row) => {
      const position = row.position !== null ? Number(row.position) : null;
      let patientsAhead = 0;
      let estimatedWaitMinutes = 0;

      if (row.status === 'WAITING') {
        patientsAhead = position !== null ? Math.max(0, position - 1) : 0;
        estimatedWaitMinutes = patientsAhead * avgMinutes + remainingMinutes;
      } else if (row.status === 'IN_CONSULTATION') {
        patientsAhead = 0;
        estimatedWaitMinutes = 0;
      } else {
        patientsAhead = 0;
        estimatedWaitMinutes = 0;
      }

      return {
        queueEntryId: row.queueEntryId,
        appointmentId: row.appointmentId,
        tokenNumber: row.tokenNumber,
        patientName: row.patientName,
        patientPhone: row.patientPhone,
        slotStart: row.slotStart,
        status: row.status,
        position,
        patientsAhead,
        estimatedWaitMinutes,
        checkedInAt: row.checkedInAt,
        calledAt: row.calledAt,
        completedAt: row.completedAt,
      };
    });

    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        consultationMinutes: doctor.consultationMinutes,
      },
      queueDate: dateStr,
      isEstimate: true,
      disclaimer: 'Estimated wait time is approximate and based on typical consultation pace.',
      currentlyInConsultation: inConsultationEntry
        ? {
            tokenNumber: inConsultationEntry.tokenNumber,
            patientName: inConsultationEntry.appointment.patientName,
            calledAt: inConsultationEntry.calledAt,
          }
        : null,
      entries,
    };
  },

  /**
   * Retrieves the patient's own view of their queue progress using appointment ID
   */
  getAppointmentQueueView: async (appointmentId) => {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new AppError(404, 'NOT_FOUND', 'Appointment not found');
    }

    const entry = appointment.queueEntry;

    // If appointment is not checked in yet
    if (!entry) {
      return {
        token: null,
        status: appointment.status,
        position: null,
        patientsAhead: 0,
        estimatedWaitMinutes: 0,
        isEstimate: true,
        disclaimer: 'Estimated wait time is approximate and may vary depending on patient consultation needs.',
      };
    }

    const avgMinutes = await queueService.getAverageConsultMinutes(appointment.doctorId);
    const inConsultationEntry = await queueRepository.findCurrentInConsultation(
      appointment.doctorId,
      entry.queueDate
    );
    const remainingMinutes = queueService.getRemainingInConsultationMinutes(inConsultationEntry, avgMinutes);

    let position = null;
    let patientsAhead = 0;
    let estimatedWaitMinutes = 0;

    if (entry.status === 'WAITING') {
      position = await queueRepository.getWaitingPositionForToken(
        entry.doctorId,
        entry.queueDate,
        entry.tokenNumber
      );
      patientsAhead = Math.max(0, position - 1);
      estimatedWaitMinutes = patientsAhead * avgMinutes + remainingMinutes;
    }

    return {
      token: entry.tokenNumber,
      status: entry.status,
      position,
      patientsAhead,
      estimatedWaitMinutes,
      isEstimate: true,
      disclaimer: 'Estimated wait time is approximate and may vary depending on patient consultation needs.',
    };
  },

  /**
   * Staff calls next patient: lowest-token WAITING -> IN_CONSULTATION
   */
  callNext: async (doctorId) => {
    const todayStr = getTodayDateString();
    const dateObj = parseDateOnly(todayStr);

    return queueRepository.callNext(doctorId, dateObj);
  },

  /**
   * Staff completes consultation: IN_CONSULTATION -> COMPLETED
   * QueueEvent is atomically recorded within the database transaction in queueRepository.
   */
  complete: async (entryId) => {
    return queueRepository.completeConsultation(entryId);
  },

  /**
   * Staff skips patient: WAITING -> SKIPPED (Appointment -> NO_SHOW)
   * QueueEvent is atomically recorded within the database transaction in queueRepository.
   */
  skip: async (entryId) => {
    return queueRepository.skipPatient(entryId);
  },
};
