import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionIdParamSchema,
} from '../validators/transaction.validator';

const router = Router();

// Apply authentication to all transaction routes
router.use(authenticate);

router.post('/', validate(createTransactionSchema), TransactionController.createTransaction);
router.get('/', TransactionController.getTransactions);
router.get('/:id', validate(transactionIdParamSchema), TransactionController.getTransactionById);
router.put('/:id', validate(updateTransactionSchema), TransactionController.updateTransaction);
router.delete('/:id', validate(transactionIdParamSchema), TransactionController.deleteTransaction);

export default router;
