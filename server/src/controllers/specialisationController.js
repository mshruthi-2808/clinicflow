import { specialisationService } from '../services/specialisationService.js';
import { sendSuccess } from '../utils/response.js';

export const specialisationController = {
  getSpecialisations: async (req, res, next) => {
    try {
      const specialisations = await specialisationService.getAllSpecialisations();
      return sendSuccess(res, 200, specialisations);
    } catch (err) {
      next(err);
    }
  },

  createSpecialisation: async (req, res, next) => {
    try {
      const specialisation = await specialisationService.createSpecialisation(req.body.name);
      return sendSuccess(res, 201, specialisation);
    } catch (err) {
      next(err);
    }
  },
};
