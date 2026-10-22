import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';

/**
 * Middleware to protect staff routes using JWT Bearer token
 */
export const requireStaffAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication token is required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    next(new AppError(401, 'UNAUTHORIZED', err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'));
  }
};
