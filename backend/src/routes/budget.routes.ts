import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { setBudgetSchema } from '../validators/budget.validator';

const router = Router();

// Apply authentication to all budget routes
router.use(authenticate);

router.get('/', BudgetController.getBudgets);
router.post('/', validate(setBudgetSchema), BudgetController.setBudget);
router.delete('/:category', BudgetController.deleteBudget);

export default router;
