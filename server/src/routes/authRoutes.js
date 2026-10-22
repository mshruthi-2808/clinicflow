import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/authValidators.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

export default router;
