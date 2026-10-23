import { statsRepository } from '../repositories/statsRepository.js';
import { parseDateOnly, getTodayDateString } from '../utils/dateTime.js';

export const statsService = {
  /**
   * Retrieves summary statistics for a given calendar date (defaults to today)
   * @param {string} [dateString] YYYY-MM-DD
   */
  getStats: async (dateString) => {
    const dateStr = dateString || getTodayDateString();
    const dateObj = parseDateOnly(dateStr);

    const stats = await statsRepository.getClinicStats(dateObj);

    return {
      date: dateStr,
      ...stats,
    };
  },

  /**
   * Retrieves doctor average consultation durations with RANK() window function ordering
   * @param {number|string} [days]
   */
  getDoctorAverages: async (days) => {
    return statsRepository.getDoctorAverages(days);
  },
};
