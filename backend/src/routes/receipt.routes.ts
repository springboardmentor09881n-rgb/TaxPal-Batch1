import express from 'express';
import multer from 'multer';
import { scanReceipt } from '../controllers/receipt.controller';
import { authenticate } from '../middleware/auth.middleware';
import { ApiError } from '../utils/ApiError';

const router = express.Router();

// Setup Multer for memory storage (no saving to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type. Only images and PDFs are allowed.'));
    }
  },
});

// Route for scanning a receipt
// We use upload.single('receipt') to expect a multipart/form-data field named 'receipt'
router.post('/scan', authenticate, upload.single('receipt'), scanReceipt);

export default router;
