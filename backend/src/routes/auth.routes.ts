import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/refresh-token', authLimiter, validateRequest(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', validateRequest(refreshTokenSchema), AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);

export default router;
