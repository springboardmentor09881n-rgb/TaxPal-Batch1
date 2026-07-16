import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetIdParamSchema,
} from '../validators/budget.validator';

const router = Router();

// Apply authentication to all budget routes
router.use(authenticate);

router.get('/progress', BudgetController.getBudgetProgress);
router.post('/', validate(createBudgetSchema), BudgetController.createBudget);
router.get('/', BudgetController.getAllBudgets);
router.get('/:id', validate(budgetIdParamSchema), BudgetController.getBudgetById);
router.put('/:id', validate(updateBudgetSchema), BudgetController.updateBudget);
router.delete('/:id', validate(budgetIdParamSchema), BudgetController.deleteBudget);

export default router;
