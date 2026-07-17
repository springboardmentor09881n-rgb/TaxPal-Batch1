"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const budget_routes_1 = __importDefault(require("./routes/budget.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const ApiError_1 = require("./utils/ApiError");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
// Set security HTTP headers
app.use((0, helmet_1.default)());
// Enable CORS with credential support
app.use((0, cors_1.default)({
    origin: true, // Echo origin to simplify testing/integration, restrict in production
    credentials: true,
}));
// Morgan logger for HTTP requests
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// Request parsers with size limit guards
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
app.use((0, cookie_parser_1.default)());
// Standard API Rate Limiter
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP address. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);
// Register routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/budgets', budget_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date(),
    });
});
// Standard root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the TaxPal: Personal Finance & Tax Estimator for Freelancers API',
    });
});
// Catch-all route handler for undefined endpoints (404)
app.use((req, res, next) => {
    next(new ApiError_1.ApiError(404, `Endpoint not found: ${req.method} ${req.originalUrl}`));
});
// Centralized error handling middleware
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map