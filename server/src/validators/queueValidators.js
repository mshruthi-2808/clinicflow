import { z } from 'zod';

export const checkInSchema = {
  body: z.object({
    appointmentId: z.string().min(1, 'Appointment ID is required'),
  }),
};

export const doctorQueueSchema = {
  params: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
  }),
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
  }),
};

export const appointmentQueueSchema = {
  params: z.object({
    appointmentId: z.string().min(1, 'Appointment ID is required'),
  }),
};

export const callNextSchema = {
  params: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
  }),
};

export const queueEntryIdSchema = {
  params: z.object({
    entryId: z.string().min(1, 'Queue entry ID is required'),
  }),
};
