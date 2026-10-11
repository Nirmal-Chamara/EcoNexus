import { Router } from 'express';
import { CollectorController } from '../controllers/collector.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  updateCollectorLocationSchema,
  updateCollectorProfileSchema,
} from '../validators/collector.validator';

const router = Router();

// 1. Update live GPS location
router.put(
  '/location',
  authenticate,
  authorize('COLLECTOR', 'ADMIN'),
  validateRequest(updateCollectorLocationSchema),
  CollectorController.updateLocation
);

// 2. Fetch collector profile
router.get(
  '/profile',
  authenticate,
  authorize('COLLECTOR', 'ADMIN'),
  CollectorController.getProfile
);

// 3. Update collector profile settings
router.put(
  '/profile',
  authenticate,
  authorize('COLLECTOR', 'ADMIN'),
  validateRequest(updateCollectorProfileSchema),
  CollectorController.updateProfile
);

// 4. Fetch assigned pickups for current collector
router.get(
  '/pickups',
  authenticate,
  authorize('COLLECTOR', 'ADMIN'),
  CollectorController.getAssignedPickups
);

export default router;
