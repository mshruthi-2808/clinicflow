import { Router } from 'express';
import { specialisationController } from '../controllers/specialisationController.js';

const router = Router();

// GET /api/v1/specialisations
router.get('/', specialisationController.getSpecialisations);

export default router;
