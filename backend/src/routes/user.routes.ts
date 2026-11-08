import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validators/user.validator';

const router = Router();

// All self-service routes require authentication
router.use(authenticate);

router.get('/me', UserController.getMe);
router.patch('/me', validateRequest(updateProfileSchema), UserController.updateMe);
router.patch('/me/password', validateRequest(changePasswordSchema), UserController.updatePassword);
router.delete('/me', UserController.deactivateMe);

export default router;
