import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '@utils/logger';
import { env } from '@config/env';
import { ApiResponse } from '@appTypes/index';

interface ExtendedError extends Error {
    statusCode?: number;
    code?: string;
    errorInfo?: { code: string };
}

export function errorHandler(err: ExtendedError, req: Request, res: Response, _next: NextFunction): void {
    logger.error('Request error', { method: req.method, url: req.url, message: err.message, code: err.code });

    if (err instanceof ZodError) {
        const response: ApiResponse<never> = { success: false, error: 'Validation error', code: 'VALIDATION_ERROR' };
        res.status(400).json(response);
        return;
    }

    const firebaseCode = String(err.errorInfo?.code ?? err.code ?? '');
    if (firebaseCode.startsWith('auth/')) {
        const response: ApiResponse<never> = { success: false, error: 'Authentication error', code: 'UNAUTHORIZED' };
        res.status(401).json(response);
        return;
    }
    if (firebaseCode === 'NOT_FOUND') {
        const response: ApiResponse<never> = { success: false, error: 'Not found', code: 'NOT_FOUND' };
        res.status(404).json(response);
        return;
    }

    const statusCode = err.statusCode ?? 500;

    if (env.NODE_ENV === 'production') {
        const response: ApiResponse<never> = {
            success: false,
            error: statusCode < 500 ? err.message : 'Internal server error',
            code: err.code ?? 'SERVER_ERROR',
        };
        res.status(statusCode).json(response);
        return;
    }

    res.status(statusCode).json({
        success: false,
        error: err.message,
        code: err.code ?? 'SERVER_ERROR',
        stack: err.stack,
    });
}
