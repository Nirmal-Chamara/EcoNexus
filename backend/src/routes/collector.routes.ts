import { Router } from 'express';
import { CollectorController } from '../controllers/collector.controller';
import {
  authenticate,
  authorize,
  requireActive,
} from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  updateCollectorLocationSchema,
  updateCollectorProfileSchema,
} from '../validators/collector.validator';

const router = Router();
router.use(authenticate, requireActive);

// 1. Update live GPS location
router.put(
  '/location',
  authorize('COLLECTOR', 'ADMIN'),
  validateRequest(updateCollectorLocationSchema),
  CollectorController.updateLocation
);

// 2. Fetch collector profile
router.get(
  '/profile',
  authorize('COLLECTOR', 'ADMIN'),
  CollectorController.getProfile
);

// 3. Update collector profile settings
router.put(
  '/profile',
  authorize('COLLECTOR', 'ADMIN'),
  validateRequest(updateCollectorProfileSchema),
  CollectorController.updateProfile
);

// 4. Fetch assigned pickups for current collector
router.get(
  '/pickups',
  authorize('COLLECTOR', 'ADMIN'),
  CollectorController.getAssignedPickups
);

// 5. Fetch collector metrics & summary stats
router.get(
  '/stats',
  authorize('COLLECTOR', 'ADMIN'),
  CollectorController.getStats
);

export default router;
