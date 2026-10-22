import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// 1. Security HTTP headers
app.use(helmet());

// 2. CORS configuration (allow client origin from env)
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);

// 3. Request body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// 5. Rate limiting on all API routes
app.use('/api', apiLimiter);

// 6. Mount API v1 router
app.use('/api/v1', apiRoutes);

// 7. 404 handler
app.use(notFoundHandler);

// 8. Centralized error handler
app.use(errorHandler);

export default app;
