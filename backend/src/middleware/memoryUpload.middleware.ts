import multer from 'multer';
import path from 'path';

// Use memory storage to process files directly in memory without saving to disk permanently.
// This fulfills the privacy-preserving requirement for documents.
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images (.jpg, .jpeg, .png) and PDF files (.pdf) are allowed'));
  }
};

export const memoryUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
