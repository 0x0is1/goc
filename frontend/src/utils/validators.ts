import { z } from 'zod';
import { TITLE_MAX_CHARS, DESCRIPTION_MIN_CHARS, DESCRIPTION_MAX_CHARS } from '@utils/constants';

export const tweetUrlSchema = z
    .string()
    .regex(
        /^https?:\/\/(twitter\.com|x\.com)\/[\w]{1,50}\/status\/\d{10,25}$/,
        'Must be a valid Twitter/X status URL'
    );

export const createPostSchema = z.object({
    tweetUrl: tweetUrlSchema,
    title: z.string().min(3, 'Title must be at least 3 characters').max(TITLE_MAX_CHARS, `Title must be ${TITLE_MAX_CHARS} characters or less`).trim(),
    description: z
        .string()
        .min(DESCRIPTION_MIN_CHARS, `Description must be at least ${DESCRIPTION_MIN_CHARS} characters`)
        .max(DESCRIPTION_MAX_CHARS, `Description must be ${DESCRIPTION_MAX_CHARS} characters or less`)
        .trim(),
    articleLinks: z.array(z.string().url()).optional().default([]),
    youtubeLink: z.string().url().optional().or(z.literal('')),
    tags: z.array(z.string()).optional(),
    showUserInfo: z.boolean().optional().default(true),
});

export const loginSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters').trim(),
        email: z.string().email('Enter a valid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

