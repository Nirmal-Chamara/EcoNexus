import { Router } from 'express';
import { PickupController } from '../controllers/pickup.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createPickupRequestSchema,
  nearbyPickupQuerySchema,
  updatePickupStatusSchema,
  pickupIdParamSchema,
  verifyWeighPickupSchema,
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

// 3b. Recommended collectors near given GPS coordinates
router.get(
  '/recommended',
  authenticate,
  PickupController.getRecommended
);

// 4. Get specific pickup request details
router.get(
  '/:id',
  authenticate,
  validateRequest(pickupIdParamSchema),
  PickupController.getById
);

// 4b. Retrieve ranked suggested collectors for a pickup request
router.get(
  '/:id/suggested-collectors',
  authenticate,
  validateRequest(pickupIdParamSchema),
  PickupController.getSuggestedCollectors
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

// 7. Collector verifies citizen handshake PIN and records scale weight
router.post(
  '/:id/verify-weigh',
  authenticate,
  authorize('COLLECTOR', 'ADMIN'),
  validateRequest(verifyWeighPickupSchema),
  PickupController.verifyWeigh
);

export default router;
