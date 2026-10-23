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

  /**
   * Computes average consultation duration and RANK() window function ordering doctors.
   * Parameterized via Prisma.$queryRaw.
   * @param {number|null} [days] Optional days interval (e.g. 7)
   */
  getDoctorAverages: async (days) => {
    const daysInterval = days ? Number(days) : null;

    let rows;
    if (daysInterval && !isNaN(daysInterval) && daysInterval > 0) {
      rows = await prisma.$queryRaw`
        SELECT 
          d.id AS "doctorId",
          d.name AS "doctorName",
          s.name AS "specialisationName",
          d."consultationMinutes" AS "configuredConsultationMinutes",
          COUNT(qe.id)::int AS "completedConsultations",
          ROUND(AVG(qe."durationMinutes"))::int AS "averageDurationMinutes",
          RANK() OVER (
            ORDER BY COALESCE(ROUND(AVG(qe."durationMinutes")), d."consultationMinutes") ASC
          )::int AS "rank"
        FROM "Doctor" d
        JOIN "Specialisation" s ON s.id = d."specialisationId"
        LEFT JOIN "QueueEvent" qe ON qe."doctorId" = d.id 
          AND qe.type = 'COMPLETED'::"QueueEventType"
          AND qe."createdAt" >= NOW() - (${daysInterval} * INTERVAL '1 day')
          AND qe."durationMinutes" IS NOT NULL
        WHERE d."isActive" = true
        GROUP BY d.id, d.name, s.name, d."consultationMinutes"
        ORDER BY "rank" ASC, d.name ASC;
      `;
    } else {
      rows = await prisma.$queryRaw`
        SELECT 
          d.id AS "doctorId",
          d.name AS "doctorName",
          s.name AS "specialisationName",
          d."consultationMinutes" AS "configuredConsultationMinutes",
          COUNT(qe.id)::int AS "completedConsultations",
          ROUND(AVG(qe."durationMinutes"))::int AS "averageDurationMinutes",
          RANK() OVER (
            ORDER BY COALESCE(ROUND(AVG(qe."durationMinutes")), d."consultationMinutes") ASC
          )::int AS "rank"
        FROM "Doctor" d
        JOIN "Specialisation" s ON s.id = d."specialisationId"
        LEFT JOIN "QueueEvent" qe ON qe."doctorId" = d.id 
          AND qe.type = 'COMPLETED'::"QueueEventType"
          AND qe."durationMinutes" IS NOT NULL
        WHERE d."isActive" = true
        GROUP BY d.id, d.name, s.name, d."consultationMinutes"
        ORDER BY "rank" ASC, d.name ASC;
      `;
    }

    return rows.map((r) => ({
      doctorId: r.doctorId,
      doctorName: r.doctorName,
      specialisationName: r.specialisationName,
      configuredConsultationMinutes: Number(r.configuredConsultationMinutes),
      completedConsultations: Number(r.completedConsultations),
      averageDurationMinutes: r.averageDurationMinutes !== null ? Number(r.averageDurationMinutes) : null,
      rank: Number(r.rank),
    }));
  },
};
