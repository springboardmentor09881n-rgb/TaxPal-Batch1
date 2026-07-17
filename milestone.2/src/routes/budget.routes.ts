import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { validate } from '../middleware/validation.middleware';
import { createBudgetSchema, getBudgetsSchema, deleteBudgetSchema } from '../validators/budget.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// CRUD routes
router.post('/', validate(createBudgetSchema), BudgetController.create);
router.get('/', validate(getBudgetsSchema), BudgetController.list);
router.delete('/:id', validate(deleteBudgetSchema), BudgetController.delete);

// Analytics routes
router.get('/progress', validate(getBudgetsSchema), BudgetController.progress);
router.get('/chart', validate(getBudgetsSchema), BudgetController.chart);

export default router;
