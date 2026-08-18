import express from 'express';
import { sendMessage, getChatSessions, getChatHistory, deleteChat } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { privacyFilter } from '../middleware/privacy.middleware';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate limiting for AI endpoint to prevent abuse
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { message: 'Too many chat requests, please try again later.' },
});

router.post('/message', authenticate, chatLimiter, privacyFilter, sendMessage);
router.post('/', authenticate, chatLimiter, privacyFilter, sendMessage); // Adding standard POST /api/chat as requested
router.get('/sessions', authenticate, getChatSessions);
router.get('/sessions/:id', authenticate, getChatHistory);
router.delete('/sessions/:id', authenticate, deleteChat);
// Keeping old routes for backwards compatibility until frontend updates
router.get('/history', authenticate, getChatHistory);
router.delete('/history', authenticate, deleteChat);

export default router;
