"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const category_validator_1 = require("../validators/category.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public suggestion route
router.post('/suggest', (0, validation_middleware_1.validate)(category_validator_1.suggestCategorySchema), category_controller_1.CategoryController.suggest);
// Protected CRUD routes
router.use(auth_middleware_1.authenticate);
router.post('/', (0, validation_middleware_1.validate)(category_validator_1.createCategorySchema), category_controller_1.CategoryController.create);
router.get('/', category_controller_1.CategoryController.list);
router.put('/:id', (0, validation_middleware_1.validate)(category_validator_1.updateCategorySchema), category_controller_1.CategoryController.update);
router.delete('/:id', category_controller_1.CategoryController.delete);
exports.default = router;
//# sourceMappingURL=category.routes.js.map