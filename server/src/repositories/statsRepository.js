import prisma from '../config/prisma.js';

export const statsRepository = {
  /**
   * Retrieves clinic operational statistics for a specific calendar date in ONE single SQL query
   * @param {Date} dateObj
   * @returns {Promise<{ totalAppointments: number, waiting: number, inConsultation: number, completed: number, cancelled: number, noShow: number }>}
   */
  getClinicStats: async (dateObj) => {
    const rows = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::int AS "totalAppointments",
        COUNT(*) FILTER (WHERE status = 'CHECKED_IN')::int AS "waiting",
        COUNT(*) FILTER (WHERE status = 'IN_CONSULTATION')::int AS "inConsultation",
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS "completed",
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS "cancelled",
        COUNT(*) FILTER (WHERE status = 'NO_SHOW')::int AS "noShow"
      FROM "Appointment"
      WHERE "appointmentDate" = ${dateObj}::date;
    `;

    const stats = rows[0] || {
      totalAppointments: 0,
      waiting: 0,
      inConsultation: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
    };

    return {
      totalAppointments: Number(stats.totalAppointments) || 0,
      waiting: Number(stats.waiting) || 0,
      inConsultation: Number(stats.inConsultation) || 0,
      completed: Number(stats.completed) || 0,
      cancelled: Number(stats.cancelled) || 0,
      noShow: Number(stats.noShow) || 0,
    };
  },
};
