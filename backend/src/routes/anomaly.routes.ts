import express from 'express';
import { scanAnomalies, getAnomalies } from '../controllers/anomaly.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/scan', authenticate, scanAnomalies);
router.get('/', authenticate, getAnomalies);

export default router;
