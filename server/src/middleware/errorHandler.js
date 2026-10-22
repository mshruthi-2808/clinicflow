import { ZodError } from 'zod';
import { AppError } from '../utils/appError.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // 1. Prisma P2002: Unique constraint violation -> 409 Conflict
  if (err.code === 'P2002') {
    statusCode = 409;
    code = 'CONFLICT';
    const target = err.meta?.target || [];
    if (
      target.includes('slotStart') ||
      target.includes('appointmentDate') ||
      target.includes('doctorId') ||
      String(err.meta?.target).includes('uniq_active_slot')
    ) {
      message = 'This slot is already booked';
    } else if (target.includes('email')) {
      message = 'A user with this email already exists';
    } else if (target.includes('name')) {
      message = 'A record with this name already exists';
    } else if (target.includes('tokenNumber')) {
      message = 'A queue entry with this token already exists for this doctor today';
    } else {
      message = 'A conflicting record already exists';
    }
  }

  // 2. Prisma P2025: Record to update/delete not found -> 404 Not Found
  else if (err.code === 'P2025') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Requested resource was not found';
  }

  // 3. Zod validation errors -> 400 Bad Request
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    // Format issues into a concise readable message
    message = err.issues.map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`).join(', ');
  }

  // 4. JWT Authentication errors -> 401 Unauthorized
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = err.name === 'TokenExpiredError' ? 'Authentication token has expired' : 'Invalid authentication token';
  }

  // 5. SyntaxError (e.g. malformed JSON in request body) -> 400 Bad Request
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Malformed JSON payload';
  }

  // If this was an unhandled unexpected error in development, log it
  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};
