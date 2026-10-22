import { Router } from 'express';
import { doctorController } from '../controllers/doctorController.js';
import { requireStaffAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getDoctorsSchema,
  doctorIdParamSchema,
  getSlotsSchema,
  createDoctorSchema,
  updateDoctorSchema,
} from '../validators/doctorValidators.js';

const router = Router();

// Public routes
// GET /api/v1/doctors?search=&specialisationId=&page=&limit=&sort=
router.get('/', validate(getDoctorsSchema), doctorController.getDoctors);

// GET /api/v1/doctors/:id
router.get('/:id', validate(doctorIdParamSchema), doctorController.getDoctorById);

// GET /api/v1/doctors/:id/slots?date=YYYY-MM-DD
router.get('/:id/slots', validate(getSlotsSchema), doctorController.getAvailableSlots);

// Protected Staff routes
// POST /api/v1/doctors
router.post('/', requireStaffAuth, validate(createDoctorSchema), doctorController.createDoctor);

// PUT /api/v1/doctors/:id
router.put('/:id', requireStaffAuth, validate(updateDoctorSchema), doctorController.updateDoctor);

// DELETE /api/v1/doctors/:id (Soft delete)
router.delete('/:id', requireStaffAuth, validate(doctorIdParamSchema), doctorController.deleteDoctor);

export default router;
