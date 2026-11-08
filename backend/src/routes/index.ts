import { Router } from 'express';
import { pool } from '../config/database';
import authRoutes from './auth.routes';
import wasteRoutes from './waste.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import pickupRoutes from './pickup.routes';
import collectorRoutes from './collector.routes';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      service: 'econexus-backend',
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      service: 'econexus-backend',
    });
  }
});

router.use('/auth', authRoutes);
router.use('/waste', wasteRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/pickup', pickupRoutes);
router.use('/collector', collectorRoutes);

export default router;
