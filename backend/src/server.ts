import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';

// Handle uncaught synchronous exceptions immediately
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! System shutting down...', err);
  process.exit(1);
});

// Connect database and run listener
connectDB().then(() => {
  const server = app.listen(env.PORT, () => {
    logger.info(`Server successfully started in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // Handle unhandled asynchronous rejections gracefully
  process.on('unhandledRejection', (err: any) => {
    logger.error('UNHANDLED REJECTION! Gracefully shutting down...', err);
    server.close(() => {
      process.exit(1);
    });
  });
});
