import { Router } from 'express';
import { TaxEstimateController } from '../controllers/taxEstimate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createTaxEstimateSchema,
  updateTaxEstimateSchema,
  getTaxEstimateByIdSchema,
} from '../validators/taxEstimate.validator';

const router = Router();

// Protect all tax estimate endpoints with JWT authentication
router.use(authenticate);

router.post('/', validate(createTaxEstimateSchema), TaxEstimateController.createTaxEstimate);
router.get('/', TaxEstimateController.getTaxEstimates);
router.get('/:id', validate(getTaxEstimateByIdSchema), TaxEstimateController.getTaxEstimateById);
router.put('/:id', validate(updateTaxEstimateSchema), TaxEstimateController.updateTaxEstimate);
router.delete('/:id', validate(getTaxEstimateByIdSchema), TaxEstimateController.deleteTaxEstimate);

export default router;
