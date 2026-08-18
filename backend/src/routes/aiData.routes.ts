import express from 'express';
import { deleteAIData } from '../controllers/aiData.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.delete('/', authenticate, deleteAIData);

export default router;
