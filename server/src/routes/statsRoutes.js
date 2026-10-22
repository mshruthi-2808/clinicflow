import { Router } from 'express';
import { statsController } from '../controllers/statsController.js';
import { validate } from '../middleware/validate.js';
import { getStatsSchema } from '../validators/statsValidators.js';

const router = Router();

// GET /api/v1/stats?date=YYYY-MM-DD
router.get('/', validate(getStatsSchema), statsController.getStats);

export default router;
