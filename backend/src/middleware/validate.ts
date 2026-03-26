import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiResponse } from '@appTypes/index';

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            const response: ApiResponse<never> = {
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                data: undefined,
            };
            res.status(400).json({ ...response, errors });
            return;
        }
        req.body = result.data;
        next();
    };
}
