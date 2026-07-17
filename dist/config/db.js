"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
exports.prisma = new client_1.PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
    ],
});
// Log Prisma queries in development mode
exports.prisma.$on('query', (e) => {
    logger_1.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
});
const connectDB = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('Database Connected via Prisma Client');
    }
    catch (error) {
        logger_1.logger.error('Error connecting to database via Prisma:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=db.js.map