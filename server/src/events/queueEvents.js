/**
 * Events module for ClinicFlow queue operations.
 *
 * DESIGN CHOICE / TRANSACTIONAL INTEGRITY:
 * By inserting the QueueEvent row INSIDE the exact same prisma.$transaction
 * as the QueueEntry state mutation, we leverage PostgreSQL's ACID guarantees.
 * Because everything lives in one database, the operational state change (e.g. updating
 * QueueEntry/Appointment status) and the audit event record commit or roll back together.
 * This completely prevents partial failures, phantom events, and state drift without
 * needing complex distributed two-phase commit (2PC) or an external outbox broker.
 */

export const QUEUE_EVENT_TYPES = {
  CHECKED_IN: 'CHECKED_IN',
  CALLED: 'CALLED',
  CALLED_NEXT: 'CALLED', // Alias for backward compatibility
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
};

/**
 * Inserts a QueueEvent row inside the active prisma.$transaction.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {object} params
 * @param {string} params.type - One of QUEUE_EVENT_TYPES (CHECKED_IN, CALLED, SKIPPED, COMPLETED)
 * @param {string} params.doctorId
 * @param {string} params.appointmentId
 * @param {number} params.tokenNumber
 * @param {number|null} [params.durationMinutes=null]
 * @param {object} [params.details={}]
 * @returns {Promise<import('@prisma/client').QueueEvent>}
 */
export const recordQueueEvent = async (
  tx,
  {
    type,
    doctorId,
    appointmentId,
    tokenNumber,
    durationMinutes = null,
    details = {},
  }
) => {
  return tx.queueEvent.create({
    data: {
      type,
      doctorId,
      appointmentId,
      tokenNumber,
      durationMinutes,
      details,
    },
  });
};

