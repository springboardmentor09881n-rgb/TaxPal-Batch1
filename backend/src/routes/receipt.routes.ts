import express from 'express';
import multer from 'multer';
import path from 'path';
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
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.webp', '.heic', '.heif'];
    const isAllowedExt = allowedExtensions.includes(ext);
    const isAllowedMime = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';

    if (isAllowedMime || isAllowedExt) {
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
