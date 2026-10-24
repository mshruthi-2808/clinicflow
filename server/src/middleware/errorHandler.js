import { ZodError } from 'zod';
import { AppError } from '../utils/appError.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred. Please try again.';

  // 1. Explicit application operational errors (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode || 500;
    code = err.code || 'INTERNAL_ERROR';
    message = err.message || 'An unexpected error occurred';
  }

  // 2. Prisma P2028: Transaction not found / closed / timeout -> 503 Service Unavailable
  else if (err.code === 'P2028' || (typeof err.message === 'string' && err.message.includes('P2028'))) {
    statusCode = 503;
    code = 'SERVICE_BUSY';
    message = 'The service is busy, please try again.';
  }

  // 3. Prisma P2002: Unique constraint violation -> 409 Conflict
  else if (err.code === 'P2002') {
    statusCode = 409;
    code = 'CONFLICT';
    const target = err.meta?.target || [];
    if (
      target.includes('slotStart') ||
      target.includes('appointmentDate') ||
      target.includes('doctorId') ||
      String(err.meta?.target).includes('uniq_active_slot')
    ) {
      code = 'SLOT_ALREADY_BOOKED';
      message = 'This slot is already booked';
    } else if (target.includes('appointmentId') || String(err.meta?.target).includes('appointmentId')) {
      code = 'ALREADY_CHECKED_IN';
      message = 'This patient is already checked in';
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

  // 4. Prisma P2025: Record to update/delete not found -> 404 Not Found
  else if (err.code === 'P2025') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Requested resource was not found';
  }

  // 5. Zod validation errors -> 400 Bad Request
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    // Format issues into a concise readable message
    message = err.issues.map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`).join(', ');
  }

  // 6. JWT Authentication errors -> 401 Unauthorized
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = err.name === 'TokenExpiredError' ? 'Authentication token has expired' : 'Invalid authentication token';
  }

  // 7. SyntaxError (e.g. malformed JSON in request body) -> 400 Bad Request
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Malformed JSON payload';
  }

  // 8. Any unmapped error (including other unhandled Prisma errors like P2003, P2034, P1001, etc.):
  // Must NEVER return raw Prisma code or message. Return code INTERNAL_ERROR and a generic message.
  else {
    statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 500
      ? err.statusCode
      : 500;
    code = 'INTERNAL_ERROR';
    message = 'An unexpected error occurred. Please try again.';
  }

  // If this was an unhandled unexpected error, log it to server console for diagnostics
  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
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
