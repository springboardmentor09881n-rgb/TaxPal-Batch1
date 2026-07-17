"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const budget_controller_1 = require("../controllers/budget.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const budget_validator_1 = require("../validators/budget.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// CRUD routes
router.post('/', (0, validation_middleware_1.validate)(budget_validator_1.createBudgetSchema), budget_controller_1.BudgetController.create);
router.get('/', (0, validation_middleware_1.validate)(budget_validator_1.getBudgetsSchema), budget_controller_1.BudgetController.list);
router.delete('/:id', (0, validation_middleware_1.validate)(budget_validator_1.deleteBudgetSchema), budget_controller_1.BudgetController.delete);
// Analytics routes
router.get('/progress', (0, validation_middleware_1.validate)(budget_validator_1.getBudgetsSchema), budget_controller_1.BudgetController.progress);
router.get('/chart', (0, validation_middleware_1.validate)(budget_validator_1.getBudgetsSchema), budget_controller_1.BudgetController.chart);
exports.default = router;
//# sourceMappingURL=budget.routes.js.map