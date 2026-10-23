/**
 * Date and slot calculation utilities for ClinicFlow Client
 * Configured for Asia/Kolkata clinic operational timezone
 */

export const CLINIC_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns YYYY-MM-DD string in Asia/Kolkata
 * @param {Date} [date]
 * @returns {string}
 */
export function getKolkataDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const partMap = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      partMap[part.type] = part.value;
    }
  }
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

/**
 * Returns tomorrow's YYYY-MM-DD string in Asia/Kolkata
 * @param {Date} [date]
 * @returns {string}
 */
export function getKolkataTomorrowDateString(date = new Date()) {
  const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  return getKolkataDateString(tomorrow);
}

/**
 * Returns HH:mm string in Asia/Kolkata
 * @param {Date} [date]
 * @returns {string}
 */
export function getKolkataTimeString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const partMap = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      partMap[part.type] = part.value;
    }
  }
  let hour = parseInt(partMap.hour, 10);
  if (hour === 24) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(partMap.minute).padStart(2, '0')}`;
}

/**
 * Converts "HH:mm" to minutes from midnight
 * @param {string} timeStr
 * @returns {number}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Checks if a slot has passed relative to the current Asia/Kolkata time.
 * @param {string} dateString YYYY-MM-DD
 * @param {string} slotStart HH:mm
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isSlotInPast(dateString, slotStart, now = new Date()) {
  const todayStr = getKolkataDateString(now);
  if (dateString < todayStr) return true;
  if (dateString > todayStr) return false;
  const currentMinutes = timeToMinutes(getKolkataTimeString(now));
  return timeToMinutes(slotStart) <= currentMinutes;
}
