import { doctorService } from '../services/doctorService.js';
import { sendSuccess } from '../utils/response.js';

export const doctorController = {
  getDoctors: async (req, res, next) => {
    try {
      const { doctors, meta } = await doctorService.getDoctors(req.query);
      return sendSuccess(res, 200, doctors, meta);
    } catch (err) {
      next(err);
    }
  },

  getDoctorById: async (req, res, next) => {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id);
      return sendSuccess(res, 200, doctor);
    } catch (err) {
      next(err);
    }
  },

  getAvailableSlots: async (req, res, next) => {
    try {
      const slots = await doctorService.getAvailableSlots(req.params.id, req.query.date);
      return sendSuccess(res, 200, slots);
    } catch (err) {
      next(err);
    }
  },

  createDoctor: async (req, res, next) => {
    try {
      const doctor = await doctorService.createDoctor(req.body);
      return sendSuccess(res, 201, doctor);
    } catch (err) {
      next(err);
    }
  },

  updateDoctor: async (req, res, next) => {
    try {
      const doctor = await doctorService.updateDoctor(req.params.id, req.body);
      return sendSuccess(res, 200, doctor);
    } catch (err) {
      next(err);
    }
  },

  deleteDoctor: async (req, res, next) => {
    try {
      const doctor = await doctorService.deleteDoctor(req.params.id);
      return sendSuccess(res, 200, {
        message: 'Doctor deactivated successfully',
        id: doctor.id,
        isActive: doctor.isActive,
      });
    } catch (err) {
      next(err);
    }
  },
};
