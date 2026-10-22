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
};
