import winston from 'winston';
import { env } from '@config/env';

const { combine, timestamp, json, printf, colorize } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${ts} [${level}] ${message} ${metaStr}`;
});

const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: env.NODE_ENV === 'production'
        ? combine(timestamp(), json())
        : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat),
    transports: [new winston.transports.Console()],
});

export default logger;
