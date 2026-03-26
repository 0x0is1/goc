import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import slowDown from 'express-slow-down';
import { env } from '@config/env';
import logger from '@utils/logger';
import { globalLimiter } from '@middleware/rateLimiter';
import { errorHandler } from '@middleware/errorHandler';
import apiRouter from '@routes/index';
import { ApiResponse } from '@appTypes/index';

const app = express();

app.use(
    helmet({
        contentSecurityPolicy: false,
        referrerPolicy: { policy: 'no-referrer' },
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
    })
);

app.use(
    cors({
        origin: env.CORS_ORIGIN,
        methods: ['GET', 'POST', 'DELETE'],
        allowedHeaders: ['Authorization', 'Content-Type'],
    })
);

app.use(express.json({ limit: '50kb' }));

app.use(
    morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        stream: { write: (msg) => logger.info(msg.trim()) },
    })
);

const speedLimiter = slowDown({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    delayAfter: env.SLOW_DOWN_DELAY_AFTER,
    delayMs: () => env.SLOW_DOWN_DELAY_MS,
});

app.use(speedLimiter);
app.use(globalLimiter);

app.use('/api', apiRouter);

app.use((_req, res) => {
    const response: ApiResponse<never> = { success: false, error: 'Route not found', code: 'ROUTE_NOT_FOUND' };
    res.status(404).json(response);
});

app.use(errorHandler);

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
    process.exit(1);
});

app.listen(env.PORT, () => {
    logger.info(`Gems of Congress API running on port ${env.PORT}`, { env: env.NODE_ENV });
});

export default app;
