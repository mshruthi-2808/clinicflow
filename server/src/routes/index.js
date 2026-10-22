import { Router } from 'express';
import authRoutes from './authRoutes.js';
import specialisationRoutes from './specialisationRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  return sendSuccess(res, 200, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'clinicflow-api',
  });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/specialisations', specialisationRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);

export default router;
