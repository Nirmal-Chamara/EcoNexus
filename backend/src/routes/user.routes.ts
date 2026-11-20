import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  updateProfileSchema,
  changePasswordSchema,
  linkGoogleSchema,
} from '../validators/user.validator';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// All self-service routes require authentication
router.use(authenticate);

router.get('/me', UserController.getMe);
router.get('/me/sign-in-methods', UserController.getSignInMethods);
router.post(
  '/me/google-link',
  authLimiter,
  validateRequest(linkGoogleSchema),
  UserController.linkGoogle
);
router.patch(
  '/me',
  validateRequest(updateProfileSchema),
  UserController.updateMe
);
router.patch(
  '/me/password',
  validateRequest(changePasswordSchema),
  UserController.updatePassword
);
router.delete('/me', UserController.deactivateMe);

export default router;
