import { Router } from 'express';
import { SalaryController } from '../controllers/salary.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createSalarySchema,
  updateSalarySchema,
  approveSalarySchema,
  salaryIdParamSchema,
} from '../validators/salary.validator';
import { UserRole } from '../utils/constants';

const router = Router();

// Require authentication for all salary routes
router.use(authenticate);

// Self salary logs lookup
router.get('/me', SalaryController.getMySalaries);

// Specific salary record lookup (Access checks for self-records performed in controller)
router.get('/:id', validate(salaryIdParamSchema), SalaryController.getSalary);

// Admin, HR, Manager can query list of salaries
router.get(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER),
  SalaryController.getSalaries
);

// Admin and HR only for modifying salary records
router.post(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.HR),
  validate(createSalarySchema),
  SalaryController.createSalary
);

router.put(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.HR),
  validate(updateSalarySchema),
  SalaryController.updateSalary
);

// Admin and Manager can approve salary requests
router.patch(
  '/:id/approve',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate(approveSalarySchema),
  SalaryController.approveSalary
);

router.delete(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.HR),
  validate(salaryIdParamSchema),
  SalaryController.deleteSalary
);

export default router;
