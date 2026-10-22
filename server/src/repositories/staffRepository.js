import prisma from '../config/prisma.js';

export const staffRepository = {
  findByEmail: async (email) => {
    return prisma.staffUser.findUnique({
      where: { email },
    });
  },

  findById: async (id) => {
    return prisma.staffUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  },
};
