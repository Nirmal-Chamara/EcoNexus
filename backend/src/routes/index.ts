import { Router } from 'express';
import authRoutes from './auth.routes';
import wasteRoutes from './waste.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'econexus-backend',
  });
});

router.use('/auth', authRoutes);
router.use('/waste', wasteRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
