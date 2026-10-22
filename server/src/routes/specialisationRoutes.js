import { Router } from 'express';
import { specialisationController } from '../controllers/specialisationController.js';
import { requireStaffAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/specialisations
router.get('/', specialisationController.getSpecialisations);

// POST /api/v1/specialisations (Staff protected)
router.post('/', requireStaffAuth, specialisationController.createSpecialisation);

export default router;
