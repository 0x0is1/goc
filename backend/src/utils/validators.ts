import { z } from 'zod';

export const tweetUrlSchema = z
    .string()
    .regex(/^https?:\/\/(twitter\.com|x\.com)\/[\w]{1,50}\/status\/\d{10,25}$/, 'Invalid tweet URL format');

export const createPostSchema = z.object({
    tweetUrl: tweetUrlSchema,
    title: z.string().min(3, 'Title too short').max(120, 'Title too long').trim(),
    description: z.string().min(10, 'Description too short').max(5000, 'Description too long').trim(),
});

export const voteSchema = z.object({
    type: z.enum(['up', 'down']),
});

export const paginationSchema = z.object({
    limit: z.coerce.number().min(1).max(50).default(20),
    cursor: z.string().optional(),
});

export const waybackRequestSchema = z.object({
    url: tweetUrlSchema,
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
