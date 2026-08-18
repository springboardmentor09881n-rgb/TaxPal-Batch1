import express from 'express';
import { extractReceiptData } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { memoryUpload } from '../middleware/memoryUpload.middleware';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate limiting for AI vision endpoint
const documentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 document uploads per 15 minutes
  message: { success: false, message: 'Too many document requests, please try again later.' },
});

// Route for extracting data from a receipt/invoice
router.post('/extract', authenticate, documentLimiter, memoryUpload.single('receipt'), extractReceiptData);

export default router;
