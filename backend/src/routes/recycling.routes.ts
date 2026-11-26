import { Router } from 'express';
import { authenticate, authorize, requireActive } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import * as recyclingController from '../controllers/recycling.controller';
import {
  upsertProfileSchema,
  addCategorySchema,
  categoryIdParamSchema,
  createIntakeSchema,
  updateIntakeStatusSchema,
  intakeIdParamSchema,
} from '../validators/recycling.validator';

const router = Router();

// Public/user-accessible directory of active recycling centers (FR19 map support)
router.get('/public/centers', authenticate, requireActive, recyclingController.getPublicCenters);

router.use(authenticate, requireActive, authorize('RECYCLING_CENTER', 'ADMIN'));

// Dashboard summary
router.get('/dashboard', recyclingController.getDashboard);

// Profile
router.get('/profile', recyclingController.getProfile);
router.put('/profile', validateRequest(upsertProfileSchema), recyclingController.upsertProfile);

// Verification status
router.get('/status', recyclingController.getVerificationStatus);

// Accepted categories
router.get('/categories', recyclingController.getCategories);
router.post('/categories', validateRequest(addCategorySchema), recyclingController.addCategory);
router.delete('/categories/:categoryId', validateRequest(categoryIdParamSchema), recyclingController.removeCategory);

// Intake records
router.get('/intake', recyclingController.getIntakeRecords);
router.post('/intake', validateRequest(createIntakeSchema), recyclingController.createIntake);
router.get('/intake/:id', validateRequest(intakeIdParamSchema), recyclingController.getIntakeById);
router.put('/intake/:id/status', validateRequest(updateIntakeStatusSchema), recyclingController.updateIntakeStatus);

export default router;
