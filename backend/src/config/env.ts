import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1),
    FIREBASE_PROJECT_ID: z.string().min(1),
    CORS_ORIGIN: z.string().default('*'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    POST_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
    VOTE_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
    SLOW_DOWN_DELAY_AFTER: z.coerce.number().int().positive().default(50),
    SLOW_DOWN_DELAY_MS: z.coerce.number().int().positive().default(500),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    process.stderr.write(JSON.stringify({ level: 'error', message: 'Invalid environment configuration', errors: parsed.error.format() }) + '\n');
    process.exit(1);
}

export const env = parsed.data;
