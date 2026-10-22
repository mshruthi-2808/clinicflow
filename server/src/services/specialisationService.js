import { specialisationRepository } from '../repositories/specialisationRepository.js';
import { AppError } from '../utils/appError.js';

export const specialisationService = {
  getAllSpecialisations: async () => {
    return specialisationRepository.findAll();
  },

  createSpecialisation: async (name) => {
    if (!name || !name.trim()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Specialisation name is required');
    }
    const trimmed = name.trim();
    try {
      return await specialisationRepository.create({ name: trimmed });
    } catch (err) {
      if (err.code === 'P2002') {
        throw new AppError(409, 'DUPLICATE_SPECIALISATION', 'A specialisation with this name already exists');
      }
      throw err;
    }
  },
};
