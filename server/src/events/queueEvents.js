/**
 * Events module for ClinicFlow queue operations
 * Currently a console logging stub; Phase 6 will persist events to PostgreSQL
 */

export const QUEUE_EVENT_TYPES = {
  CHECKED_IN: 'CHECKED_IN',
  CALLED_NEXT: 'CALLED_NEXT',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
};

/**
 * Records a queue event
 * @param {string} type Event type
 * @param {object} payload Event metadata and details
 */
export const recordQueueEvent = (type, payload) => {
  const timestamp = new Date().toISOString();
  console.log(`[QueueEvent] [${timestamp}] [${type}]`, JSON.stringify(payload));
};
