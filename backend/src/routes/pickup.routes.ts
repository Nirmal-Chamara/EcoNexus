import { Router } from 'express';
import { PickupController } from '../controllers/pickup.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createPickupRequestSchema,
  nearbyPickupQuerySchema,
  updatePickupStatusSchema,
  pickupIdParamSchema,
} from '../validators/pickup.validator';

const router = Router();

// 1. User creates a pickup request
router.post(
  '/request',
  authenticate,
  validateRequest(createPickupRequestSchema),
  PickupController.createRequest
);

// 2. Collector searches nearby open requests
router.get(
  '/nearby',
  authenticate,
  authorize('COLLECTOR', 'ADMIN'),
  validateRequest(nearbyPickupQuerySchema),
  PickupController.getNearby
);

// 3. User views their own pickup requests
router.get(
  '/my',
  authenticate,
  PickupController.getMyPickups
);

// 4. Get specific pickup request details
router.get(
  '/:id',
  authenticate,
  validateRequest(pickupIdParamSchema),
  PickupController.getById
);

// 5. Collector accepts an open pickup request
router.post(
  '/:id/accept',
  authenticate,
  authorize('COLLECTOR', 'ADMIN'),
  validateRequest(pickupIdParamSchema),
  PickupController.acceptPickup
);

// 6. Collector updates status (e.g., IN_TRANSIT, COMPLETED)
router.put(
  '/:id/status',
  authenticate,
  authorize('COLLECTOR', 'ADMIN'),
  validateRequest(updatePickupStatusSchema),
  PickupController.updateStatus
);

export default router;
