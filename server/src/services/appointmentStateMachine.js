import { AppError } from '../utils/appError.js';

/**
 * Strict appointment status lifecycle transition map
 * Allowed transitions:
 * - BOOKED -> CHECKED_IN, CANCELLED, NO_SHOW
 * - CHECKED_IN -> IN_CONSULTATION, CANCELLED, NO_SHOW
 * - IN_CONSULTATION -> COMPLETED
 * - Terminal states (COMPLETED, CANCELLED, NO_SHOW) cannot transition further
 */
export const APPOINTMENT_TRANSITIONS = {
  BOOKED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['IN_CONSULTATION', 'CANCELLED', 'NO_SHOW'],
  IN_CONSULTATION: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/**
 * Validates that a status transition is permitted by domain rules.
 * Throws AppError with status 409 Conflict if transition is illegal.
 *
 * @param {string} from Current status
 * @param {string} to Target status
 * @throws {AppError}
 */
export const assertTransition = (from, to) => {
  const allowed = APPOINTMENT_TRANSITIONS[from];

  if (!allowed || !allowed.includes(to)) {
    throw new AppError(
      409,
      'INVALID_STATUS_TRANSITION',
      `Cannot transition appointment status from '${from}' to '${to}'. Allowed next states: [${(allowed || []).join(', ')}]`
    );
  }
};
