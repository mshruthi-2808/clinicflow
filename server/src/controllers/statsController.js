import { statsService } from '../services/statsService.js';
import { sendSuccess } from '../utils/response.js';

export const statsController = {
  getStats: async (req, res, next) => {
    try {
      const stats = await statsService.getStats(req.query.date);
      return sendSuccess(res, 200, stats);
    } catch (err) {
      next(err);
    }
  },
};
