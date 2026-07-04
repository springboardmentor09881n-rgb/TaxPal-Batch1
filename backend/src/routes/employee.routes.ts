import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamSchema,
} from '../validators/employee.validator';
import { UserRole } from '../utils/constants';

const router = Router();

// Require authentication for all employee routes
router.use(authenticate);

// Self employee profile check
router.get('/me', EmployeeController.getMyEmployeeProfile);

// Specific employee profile check (Access checked inside controller for self check)
router.get('/:id', validate(employeeIdParamSchema), EmployeeController.getEmployee);

// Admin, HR, Manager can query list of employees
router.get(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER),
  EmployeeController.getEmployees
);

// Admin and HR only for modifying employee entities
router.post(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.HR),
  validate(createEmployeeSchema),
  EmployeeController.createEmployee
);

router.put(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.HR),
  validate(updateEmployeeSchema),
  EmployeeController.updateEmployee
);

router.delete(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.HR),
  validate(employeeIdParamSchema),
  EmployeeController.deleteEmployee
);

export default router;
