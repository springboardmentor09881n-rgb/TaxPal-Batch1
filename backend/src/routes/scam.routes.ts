import express from 'express';
import { analyzeScam } from '../controllers/scam.controller';
import { authenticate } from '../middleware/auth.middleware';
import { privacyFilter } from '../middleware/privacy.middleware';

const router = express.Router();

// The privacyFilter will block the request if any passwords, OTPs, CVVs, or bank routing numbers are found in req.body.message
router.post('/analyze', authenticate, privacyFilter, analyzeScam);

export default router;
