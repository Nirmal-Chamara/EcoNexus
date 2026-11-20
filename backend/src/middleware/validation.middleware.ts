import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function validateRequest(schema: ZodSchema) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as {
        body?: Request['body'];
        query?: Request['query'];
        params?: Request['params'];
      };
      // Controllers must consume the validated result, including defaults,
      // normalization and stripped unknown fields, rather than the raw input.
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;
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
