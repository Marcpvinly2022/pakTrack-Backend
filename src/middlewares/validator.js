import { AppError } from './errorHandler.js';

export const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const message = result.error.issues?.[0]?.message || 'Input validation failed.';
    return next(new AppError(400, 'VALIDATION_ERROR', message));
  }

  if (result.data.body !== undefined) {
    req.body = result.data.body;
  }

  return next();
};