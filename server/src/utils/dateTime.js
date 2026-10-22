/**
 * Date and slot calculation utilities for ClinicFlow
 */

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Returns UTC Date object at 00:00:00 for storing in PostgreSQL Date column
 * @param {string} dateString YYYY-MM-DD
 * @returns {Date}
 */
export const parseDateOnly = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

/**
 * Formats a Date object as YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export const formatDateOnly = (date) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Gets day of week key ("mon", "tue", etc.) for a YYYY-MM-DD string
 * @param {string} dateString
 * @returns {string}
 */
export const getDayKey = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return DAY_NAMES[d.getDay()];
};

/**
 * Converts "HH:mm" to minutes from midnight
 * @param {string} timeStr
 * @returns {number}
 */
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts minutes from midnight to "HH:mm"
 * @param {number} totalMinutes
 * @returns {string}
 */
export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Generates an array of slotStart strings between start and end times
 * @param {string} start "HH:mm"
 * @param {string} end "HH:mm"
 * @param {number} slotMinutes
 * @returns {string[]}
 */
export const generateSlotIntervals = (start, end, slotMinutes = 15) => {
  const slots = [];
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  for (let current = startMin; current + slotMinutes <= endMin; current += slotMinutes) {
    slots.push(minutesToTime(current));
  }

  return slots;
};

/**
 * Checks if a given date string is in the past relative to today
 * @param {string} dateString YYYY-MM-DD
 * @returns {boolean}
 */
export const isPastDate = (dateString) => {
  const todayStr = getTodayDateString();
  return dateString < todayStr;
};

/**
 * Returns today's date in YYYY-MM-DD according to local system time
 * @returns {string}
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns current local time in "HH:mm"
 * @returns {string}
 */
export const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};
