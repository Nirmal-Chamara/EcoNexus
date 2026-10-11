import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize, requireActive } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  userQuerySchema,
  updateUserStatusSchema,
  verificationQuerySchema,
  processVerificationSchema,
} from '../validators/admin.validator';

const router = Router();

// All routes require ADMIN role and active status
router.use(authenticate, requireActive, authorize('ADMIN'));

router.get('/users', validateRequest(userQuerySchema), AdminController.getUsers);
router.patch('/users/:id/status', validateRequest(updateUserStatusSchema), AdminController.updateUserStatus);

router.get('/verifications', validateRequest(verificationQuerySchema), AdminController.getVerifications);
router.patch('/verifications/:id/process', validateRequest(processVerificationSchema), AdminController.processVerification);

export default router;
