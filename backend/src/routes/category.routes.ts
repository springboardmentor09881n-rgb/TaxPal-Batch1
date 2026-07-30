import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All category routes are protected
router.get('/', authenticate, CategoryController.getCategories);
router.get('/type/:type', authenticate, CategoryController.getCategoriesByType);
router.post('/', authenticate, CategoryController.createCategory);
router.put('/:categoryId', authenticate, CategoryController.updateCategory);
router.delete('/:categoryId', authenticate, CategoryController.deleteCategory);
router.post('/initialize-default', authenticate, CategoryController.initializeDefaultCategories);

export default router;
