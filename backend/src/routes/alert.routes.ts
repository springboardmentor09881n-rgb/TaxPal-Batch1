import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createAlertSchema, alertIdParamSchema } from '../validators/alert.validator';

const router = Router();

// Protect all alert routes with JWT authentication
router.use(authenticate);

router.post('/', validate(createAlertSchema), AlertController.createAlert);
router.get('/', AlertController.getAlerts);
router.get('/:id', validate(alertIdParamSchema), AlertController.getAlertById);
router.put('/:id/read', validate(alertIdParamSchema), AlertController.markAsRead);
router.delete('/:id', validate(alertIdParamSchema), AlertController.deleteAlert);

export default router;
