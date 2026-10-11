import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function validateRequest(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.slice(1).join('.'),
          message: issue.message,
        }));
        const firstMessage = formattedErrors[0]?.message || 'Validation failed';
        next(new AppError(400, firstMessage, 'VALIDATION_ERROR'));
        return;
      }
      next(error);
    }
  };
}
