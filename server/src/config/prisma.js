import { PrismaClient } from '@prisma/client';

// PrismaClient singleton instance to prevent multiple client instances in development
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

globalForPrisma.prisma = prisma;

export default prisma;
