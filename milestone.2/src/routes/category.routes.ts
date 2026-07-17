import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validate } from '../middleware/validation.middleware';
import { createCategorySchema, updateCategorySchema, suggestCategorySchema } from '../validators/category.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public suggestion route
router.post('/suggest', validate(suggestCategorySchema), CategoryController.suggest);

// Protected CRUD routes
router.use(authenticate);
router.post('/', validate(createCategorySchema), CategoryController.create);
router.get('/', CategoryController.list);
router.put('/:id', validate(updateCategorySchema), CategoryController.update);
router.delete('/:id', CategoryController.delete);

export default router;
