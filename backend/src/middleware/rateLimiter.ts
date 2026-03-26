import rateLimit from 'express-rate-limit';
import { env } from '@config/env';
import { ApiResponse } from '@appTypes/index';

function rateLimitJson(message: string): ApiResponse<never> {
    return { success: false, error: message, code: 'RATE_LIMITED' };
}

export const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json(rateLimitJson('Too many requests'));
    },
});

export const postCreateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.POST_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json(rateLimitJson('Post creation rate limit exceeded'));
    },
});

export const voteLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.VOTE_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json(rateLimitJson('Vote rate limit exceeded'));
    },
});
