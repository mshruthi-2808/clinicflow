/**
 * Standard API response helper
 * Shape: { success: true, data: any, meta?: object }
 */
export const sendSuccess = (res, statusCode = 200, data = null, meta = undefined) => {
  const payload = {
    success: true,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};
