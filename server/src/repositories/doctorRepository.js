import prisma from '../config/prisma.js';

export const doctorRepository = {
  findAll: async ({ where = {}, skip = 0, take = 10, orderBy = { name: 'asc' } }) => {
    return prisma.doctor.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        specialisation: true,
      },
    });
  },

  count: async (where = {}) => {
    return prisma.doctor.count({ where });
  },

  findById: async (id) => {
    return prisma.doctor.findUnique({
      where: { id },
      include: {
        specialisation: true,
      },
    });
  },

  create: async (data) => {
    return prisma.doctor.create({
      data,
      include: {
        specialisation: true,
      },
    });
  },

  update: async (id, data) => {
    return prisma.doctor.update({
      where: { id },
      data,
      include: {
        specialisation: true,
      },
    });
  },

  softDelete: async (id) => {
    return prisma.doctor.update({
      where: { id },
      data: { isActive: false },
      include: {
        specialisation: true,
      },
    });
  },
};
