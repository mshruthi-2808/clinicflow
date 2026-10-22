import { appointmentService } from '../services/appointmentService.js';
import { sendSuccess } from '../utils/response.js';

export const appointmentController = {
  bookAppointment: async (req, res, next) => {
    try {
      const appointment = await appointmentService.bookAppointment(req.body);
      return sendSuccess(res, 201, appointment);
    } catch (err) {
      next(err);
    }
  },

  getAppointments: async (req, res, next) => {
    try {
      const { appointments, meta } = await appointmentService.getAppointments(req.query);
      return sendSuccess(res, 200, appointments, meta);
    } catch (err) {
      next(err);
    }
  },

  getAppointmentById: async (req, res, next) => {
    try {
      const appointment = await appointmentService.getAppointmentById(req.params.id);
      return sendSuccess(res, 200, appointment);
    } catch (err) {
      next(err);
    }
  },

  cancelAppointment: async (req, res, next) => {
    try {
      const appointment = await appointmentService.cancelAppointment(req.params.id);
      return sendSuccess(res, 200, appointment);
    } catch (err) {
      next(err);
    }
  },
};
