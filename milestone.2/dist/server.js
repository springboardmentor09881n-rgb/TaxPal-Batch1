"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
// Handle uncaught synchronous exceptions immediately
process.on('uncaughtException', (err) => {
    logger_1.logger.error('UNCAUGHT EXCEPTION! System shutting down...', err);
    process.exit(1);
});
// Connect database and run listener
(0, db_1.connectDB)().then(() => {
    const server = app_1.default.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server successfully started in ${env_1.env.NODE_ENV} mode on port ${env_1.env.PORT}`);
    });
    // Handle unhandled asynchronous rejections gracefully
    process.on('unhandledRejection', (err) => {
        logger_1.logger.error('UNHANDLED REJECTION! Gracefully shutting down...', err);
        server.close(() => {
            process.exit(1);
        });
    });
});
//# sourceMappingURL=server.js.map