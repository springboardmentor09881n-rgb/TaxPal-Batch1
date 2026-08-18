import express from 'express';
import { simulateTax } from '../controllers/taxPlanning.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/simulate', authenticate, simulateTax);

export default router;
