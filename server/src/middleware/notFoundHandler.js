import { AppError } from '../utils/appError.js';

export const notFoundHandler = (req, res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};
