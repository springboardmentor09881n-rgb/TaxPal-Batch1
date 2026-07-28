import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    try {
      await conn.connection.db?.collection('budgets').dropIndex('userId_1_category_1');
      logger.info('Dropped old unique index userId_1_category_1 successfully');
    } catch (e) {
      // Index might not exist, which is fine
    }
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error occurred:', err);
});
