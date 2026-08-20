import { Router } from 'express';
import { sendMessage, getChatSessions, getChatHistory, deleteChat } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all chat routes
router.use(authenticate);

router.post('/message', sendMessage);
router.get('/sessions', getChatSessions);
router.get('/sessions/:id', getChatHistory);
router.delete('/sessions/:id', deleteChat);

export default router;
