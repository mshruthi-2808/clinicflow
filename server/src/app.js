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
app.set('trust proxy', 1);

// 1. Security HTTP headers
app.use(helmet());

// 2. Private Network Access (PNA) & CORS configuration
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

const allowedOrigins = [
  config.clientOrigin,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/.*\.trycloudflare\.com$/.test(origin) ||
        /^https:\/\/.*\.loca\.lt$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
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
app.use(['/api', '/v1'], apiLimiter);

// 6. Mount API v1 router on both /api/v1 and /v1 (flexible serverless / proxy pathing)
app.use('/api/v1', apiRoutes);
app.use('/v1', apiRoutes);

// 7. 404 handler
app.use(notFoundHandler);

// 8. Centralized error handler
app.use(errorHandler);

export default app;
