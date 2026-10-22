import { queueService } from '../services/queueService.js';
import { sendSuccess } from '../utils/response.js';

export const queueController = {
  checkIn: async (req, res, next) => {
    try {
      const result = await queueService.checkIn(req.body.appointmentId);
      return sendSuccess(res, 201, result);
    } catch (err) {
      next(err);
    }
  },

  getDoctorQueue: async (req, res, next) => {
    try {
      const queue = await queueService.getDoctorQueue(req.params.doctorId, req.query.date);
      return sendSuccess(res, 200, queue);
    } catch (err) {
      next(err);
    }
  },

  getAppointmentQueueView: async (req, res, next) => {
    try {
      const view = await queueService.getAppointmentQueueView(req.params.appointmentId);
      return sendSuccess(res, 200, view);
    } catch (err) {
      next(err);
    }
  },

  callNext: async (req, res, next) => {
    try {
      const result = await queueService.callNext(req.params.doctorId);
      return sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  complete: async (req, res, next) => {
    try {
      const result = await queueService.complete(req.params.entryId);
      return sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  skip: async (req, res, next) => {
    try {
      const result = await queueService.skip(req.params.entryId);
      return sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },
};
