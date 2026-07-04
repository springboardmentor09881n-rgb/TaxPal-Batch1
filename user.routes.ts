import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updateProfileSchema, changePasswordSchema, userIdParamSchema } from '../validators/user.validator';
import { UserRole } from '../utils/constants';

const router = Router();

// Apply authentication to all user routes
router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', validate(updateProfileSchema), UserController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), UserController.changePassword);

// HR and Admin only
router.delete('/:id', authorizeRoles(UserRole.ADMIN, UserRole.HR), validate(userIdParamSchema), UserController.deleteUser);

export default router;
