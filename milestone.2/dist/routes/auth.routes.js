"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', (0, validation_middleware_1.validate)(auth_validator_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', (0, validation_middleware_1.validate)(auth_validator_1.loginSchema), auth_controller_1.AuthController.login);
// Protected routes
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.AuthController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map