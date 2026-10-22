import { authService } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

export const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },
};
