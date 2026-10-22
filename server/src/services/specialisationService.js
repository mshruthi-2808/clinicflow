import { specialisationRepository } from '../repositories/specialisationRepository.js';

export const specialisationService = {
  getAllSpecialisations: async () => {
    return specialisationRepository.findAll();
  },
};
