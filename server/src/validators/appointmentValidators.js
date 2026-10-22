import { z } from 'zod';

export const bookAppointmentSchema = {
  body: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
    patientName: z
      .string()
      .min(2, 'Patient name must be at least 2 characters')
      .max(100, 'Patient name must not exceed 100 characters'),
    patientPhone: z
      .string()
      .min(7, 'Phone number must be at least 7 characters')
      .max(15, 'Phone number must not exceed 15 characters')
      .regex(/^[0-9+\-\s()]{7,15}$/, 'Please provide a valid contact phone number'),
    reason: z.string().max(255, 'Reason must not exceed 255 characters').optional(),
    appointmentDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Appointment date must be formatted as YYYY-MM-DD'),
    slotStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Slot start time must be in HH:mm format'),
  }),
};

export const getAppointmentsSchema = {
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
    doctorId: z.string().optional(),
    status: z
      .enum(['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
      .optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
    sort: z.string().optional().default('appointmentDate:asc'),
  }),
};

export const appointmentIdParamSchema = {
  params: z.object({
    id: z.string().min(1, 'Appointment ID is required'),
  }),
};
