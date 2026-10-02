import { Router } from 'express';
import wasteRoutes from './waste.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'econexus-backend',
  });
});

router.use('/waste', wasteRoutes);

export default router;
