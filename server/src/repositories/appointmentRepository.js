import prisma from '../config/prisma.js';

export const appointmentRepository = {
  findAll: async ({ where = {}, skip = 0, take = 10, orderBy = { slotStart: 'asc' } }) => {
    return prisma.appointment.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        doctor: {
          include: {
            specialisation: true,
          },
        },
      },
    });
  },

  count: async (where = {}) => {
    return prisma.appointment.count({ where });
  },

  findById: async (id) => {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            specialisation: true,
          },
        },
        queueEntry: true,
      },
    });
  },

  findActiveByDoctorAndSlot: async (doctorId, appointmentDate, slotStart) => {
    return prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate,
        slotStart,
        status: {
          not: 'CANCELLED',
        },
      },
    });
  },

  findActiveByDoctorAndDate: async (doctorId, appointmentDate) => {
    return prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate,
        status: {
          not: 'CANCELLED',
        },
      },
      select: {
        id: true,
        slotStart: true,
        status: true,
      },
    });
  },

  create: async (data) => {
    return prisma.appointment.create({
      data,
      include: {
        doctor: {
          include: {
            specialisation: true,
          },
        },
      },
    });
  },

  update: async (id, data) => {
    return prisma.appointment.update({
      where: { id },
      data,
      include: {
        doctor: {
          include: {
            specialisation: true,
          },
        },
      },
    });
  },
};
