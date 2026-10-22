import { Router } from 'express';
import { queueController } from '../controllers/queueController.js';
import { requireStaffAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  checkInSchema,
  doctorQueueSchema,
  appointmentQueueSchema,
  callNextSchema,
  queueEntryIdSchema,
} from '../validators/queueValidators.js';

const router = Router();

// Staff check-in: POST /api/v1/queue/check-in
router.post('/check-in', requireStaffAuth, validate(checkInSchema), queueController.checkIn);

// Live doctor queue (Staff protected): GET /api/v1/queue/doctor/:doctorId?date=YYYY-MM-DD
router.get('/doctor/:doctorId', requireStaffAuth, validate(doctorQueueSchema), queueController.getDoctorQueue);

// Patient own queue view: GET /api/v1/queue/appointment/:appointmentId
router.get('/appointment/:appointmentId', validate(appointmentQueueSchema), queueController.getAppointmentQueueView);

// Staff call next patient: POST /api/v1/queue/doctor/:doctorId/call-next
router.post('/doctor/:doctorId/call-next', requireStaffAuth, validate(callNextSchema), queueController.callNext);

// Staff complete consultation: POST /api/v1/queue/:entryId/complete
router.post('/:entryId/complete', requireStaffAuth, validate(queueEntryIdSchema), queueController.complete);

// Staff skip patient: POST /api/v1/queue/:entryId/skip
router.post('/:entryId/skip', requireStaffAuth, validate(queueEntryIdSchema), queueController.skip);

export default router;
