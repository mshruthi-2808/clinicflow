import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController.js';
import { validate } from '../middleware/validate.js';
import {
  bookAppointmentSchema,
  getAppointmentsSchema,
  appointmentIdParamSchema,
} from '../validators/appointmentValidators.js';

const router = Router();

// POST /api/v1/appointments
router.post('/', validate(bookAppointmentSchema), appointmentController.bookAppointment);

// GET /api/v1/appointments?date=&doctorId=&status=&search=&page=&limit=&sort=
router.get('/', validate(getAppointmentsSchema), appointmentController.getAppointments);

// GET /api/v1/appointments/:id
router.get('/:id', validate(appointmentIdParamSchema), appointmentController.getAppointmentById);

// PATCH /api/v1/appointments/:id/cancel
router.patch('/:id/cancel', validate(appointmentIdParamSchema), appointmentController.cancelAppointment);

export default router;
