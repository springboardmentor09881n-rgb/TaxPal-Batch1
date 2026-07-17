import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

// Log Prisma queries in development mode
prisma.$on('query' as any, (e: any) => {
  logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
});

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database Connected via Prisma Client');
  } catch (error) {
    logger.error('Error connecting to database via Prisma:', error);
    process.exit(1);
  }
};
