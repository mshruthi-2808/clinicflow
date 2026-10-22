import prisma from '../config/prisma.js';

export const specialisationRepository = {
  findAll: async () => {
    return prisma.specialisation.findMany({
      orderBy: { name: 'asc' },
    });
  },

  findById: async (id) => {
    return prisma.specialisation.findUnique({
      where: { id },
    });
  },

  create: async (data) => {
    return prisma.specialisation.create({
      data,
    });
  },
};
