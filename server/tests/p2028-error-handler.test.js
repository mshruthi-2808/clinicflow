import { describe, it, expect } from 'vitest';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Prisma P2028 & Central Error Handler Test Suite', () => {
  const createMockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  it('1. Maps Prisma P2028 to 503 SERVICE_BUSY with "The service is busy, please try again."', () => {
    const p2028Error = new Error('Transaction not found / old closed transaction');
    p2028Error.code = 'P2028';

    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(p2028Error, req, res, next);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'SERVICE_BUSY',
        message: 'The service is busy, please try again.',
      },
    });
  });

  it('2. Maps P2028 in error message to 503 SERVICE_BUSY even if code property was omitted', () => {
    const p2028MsgError = new Error('Prisma error P2028: Transaction already closed');

    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(p2028MsgError, req, res, next);

    expect(res.statusCode).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_BUSY');
    expect(res.body.error.message).toBe('The service is busy, please try again.');
  });

  it('3. Never returns raw Prisma code or message for unmapped Prisma errors (e.g. P2034, P2010)', () => {
    const unmappedPrismaError = new Error('Raw Prisma Rust panic / unmapped database error details: SELECT * FROM secret');
    unmappedPrismaError.code = 'P2034';

    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(unmappedPrismaError, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('An unexpected error occurred. Please try again.');
    expect(res.body.error.code).not.toContain('P2034');
    expect(res.body.error.message).not.toContain('Prisma');
    expect(res.body.error.message).not.toContain('secret');
  });

  it('4. Returns code INTERNAL_ERROR and generic message for generic unhandled errors', () => {
    const genericError = new TypeError('Cannot read properties of undefined (reading foo)');

    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(genericError, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('An unexpected error occurred. Please try again.');
  });
});
