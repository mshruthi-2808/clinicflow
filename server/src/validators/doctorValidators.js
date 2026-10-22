import { z } from 'zod';

export const getDoctorsSchema = {
  query: z.object({
    search: z.string().optional(),
    specialisationId: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
    sort: z.string().optional().default('name:asc'),
    activeOnly: z.enum(['true', 'false', 'all']).optional().default('true'),
  }),
};

export const doctorIdParamSchema = {
  params: z.object({
    id: z.string().min(1, 'Doctor ID is required'),
  }),
};

export const getSlotsSchema = {
  params: z.object({
    id: z.string().min(1, 'Doctor ID is required'),
  }),
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  }),
};

const dayScheduleSchema = z
  .object({
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format'),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format'),
  })
  .optional();

export const createDoctorSchema = {
  body: z.object({
    name: z.string().min(2, 'Doctor name must be at least 2 characters'),
    specialisationId: z.string().min(1, 'Specialisation ID is required'),
    consultationMinutes: z.coerce.number().int().min(5).max(120).optional().default(15),
    slotMinutes: z.coerce.number().int().min(5).max(120).optional().default(15),
    schedule: z
      .object({
        mon: dayScheduleSchema,
        tue: dayScheduleSchema,
        wed: dayScheduleSchema,
        thu: dayScheduleSchema,
        fri: dayScheduleSchema,
        sat: dayScheduleSchema,
        sun: dayScheduleSchema,
      })
      .default({}),
    isActive: z.boolean().optional().default(true),
  }),
};

export const updateDoctorSchema = {
  params: z.object({
    id: z.string().min(1, 'Doctor ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    specialisationId: z.string().min(1).optional(),
    consultationMinutes: z.coerce.number().int().min(5).max(120).optional(),
    slotMinutes: z.coerce.number().int().min(5).max(120).optional(),
    schedule: z
      .object({
        mon: dayScheduleSchema,
        tue: dayScheduleSchema,
        wed: dayScheduleSchema,
        thu: dayScheduleSchema,
        fri: dayScheduleSchema,
        sat: dayScheduleSchema,
        sun: dayScheduleSchema,
      })
      .optional(),
    isActive: z.boolean().optional(),
  }),
};
