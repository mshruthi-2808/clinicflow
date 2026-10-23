/**
 * Date and slot calculation utilities for ClinicFlow
 * Configured specifically for Asia/Kolkata clinic operational timezone
 */

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const CLINIC_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns { year, month, day, hour, minute, second, dateString, timeString, totalMinutes }
 * in Asia/Kolkata timezone dynamically for any given Date instance (defaults to now).
 * @param {Date} [date]
 * @returns {{ year: string, month: string, day: string, hour: string, minute: string, second: string, dateString: string, timeString: string, totalMinutes: number }}
 */
export const getKolkataDateTime = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(partMap.minute).padStart(2, '0');
  const secondStr = String(partMap.second).padStart(2, '0');

  return {
    year: partMap.year,
    month: partMap.month,
    day: partMap.day,
    hour: hourStr,
    minute: minuteStr,
    second: secondStr,
    dateString: `${partMap.year}-${partMap.month}-${partMap.day}`,
    timeString: `${hourStr}:${minuteStr}`,
    totalMinutes: hour * 60 + parseInt(minuteStr, 10),
  };
};

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
 * Uses midday UTC to avoid any DST or timezone offset shifts
 * @param {string} dateString
 * @returns {string}
 */
export const getDayKey = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return DAY_NAMES[d.getUTCDay()];
};

/**
 * Converts "HH:mm" to minutes from midnight
 * @param {string} timeStr
 * @returns {number}
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
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
 * Checks if a given date string is in the past relative to today in Asia/Kolkata
 * @param {string} dateString YYYY-MM-DD
 * @param {Date} [now]
 * @returns {boolean}
 */
export const isPastDate = (dateString, now = new Date()) => {
  const todayStr = getTodayDateString(now);
  return dateString < todayStr;
};

/**
 * Returns today's date in YYYY-MM-DD in Asia/Kolkata
 * @param {Date} [now]
 * @returns {string}
 */
export const getTodayDateString = (now = new Date()) => {
  return getKolkataDateTime(now).dateString;
};

/**
 * Returns current time in "HH:mm" in Asia/Kolkata
 * @param {Date} [now]
 * @returns {string}
 */
export const getCurrentTimeString = (now = new Date()) => {
  return getKolkataDateTime(now).timeString;
};

/**
 * Returns current minutes from midnight in Asia/Kolkata
 * @param {Date} [now]
 * @returns {number}
 */
export const getCurrentMinutesInKolkata = (now = new Date()) => {
  return getKolkataDateTime(now).totalMinutes;
};

/**
 * Checks if a slot has passed relative to the current Asia/Kolkata time.
 * @param {string} dateString YYYY-MM-DD
 * @param {string} slotStart HH:mm
 * @param {Date} [now]
 * @returns {boolean}
 */
export const isSlotInPast = (dateString, slotStart, now = new Date()) => {
  const kolkata = getKolkataDateTime(now);
  if (dateString < kolkata.dateString) {
    return true;
  }
  if (dateString > kolkata.dateString) {
    return false;
  }
  return timeToMinutes(slotStart) <= kolkata.totalMinutes;
};
