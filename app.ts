import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import employeeRoutes from './routes/employee.routes';
import salaryRoutes from './routes/salary.routes';

import { errorHandler } from './middleware/error.middleware';
import { ApiError } from './utils/ApiError';
import { env } from './config/env';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS with credential support
app.use(
  cors({
    origin: true, // Echo origin to simplify testing/integration, restrict in production
    credentials: true,
  })
);

// Morgan logger for HTTP requests
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request parsers with size limit guards
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitize inputs to prevent MongoDB Query Injection
app.use(mongoSanitize());

// Standard API Rate Limiter
const apiLimiter = rateLimit({
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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/salary', salaryRoutes);

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
    message: 'Welcome to the Salary Management System API',
  });
});

// Catch-all route handler for undefined endpoints (404)
app.use((req, res, next) => {
  next(new ApiError(404, `Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
