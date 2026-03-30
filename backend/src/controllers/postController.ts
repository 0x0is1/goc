import { Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@utils/asyncHandler';
import { PostService } from '@services/PostService';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse, Post } from '@appTypes/index';
import { createPostSchema, paginationSchema } from '@utils/validators';

export const listPosts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = paginationSchema.parse({
        limit: req.query['limit'],
        cursor: req.query['cursor'],
        sort: req.query['sort'],
        tag: req.query['tag'],
    });
    const result = await PostService.getFeed(query.limit, query.cursor, query.sort as 'latest' | 'top', query.tag);
    const response: PaginatedResponse<Post> = {
        success: true,
        data: result.posts,
        meta: { cursor: result.cursor, hasMore: result.hasMore },
    };
    res.json(response);
});

export const getPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const post = await PostService.getPost(id);
    const response: ApiResponse<Post> = { success: true, data: post };
    res.json(response);
});

export const createPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.uid;
    const authorName = (req.user!.name as string | undefined) ?? 'Anonymous';
    const authorAvatar = (req.user!.picture as string | undefined) ?? '';
    try {
        const validated = createPostSchema.parse(req.body);
        const post = await PostService.createPost(validated, userId, authorName, authorAvatar);
        const response: ApiResponse<Post> = { success: true, data: post };
        res.status(201).json(response);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            console.error('[PostController] Validation error:', JSON.stringify(err.issues, null, 2));
            console.error('[PostController] Body causing error:', JSON.stringify(req.body, null, 2));
        }
        throw err;
    }
});

export const deletePost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    await PostService.deletePost(id, req.user!.uid);
    const response: ApiResponse<null> = { success: true };
    res.json(response);
});

export const updatePost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    try {
        const validated = createPostSchema.parse(req.body);
        const post = await PostService.updatePost(id, validated, req.user!.uid);
        const response: ApiResponse<Post> = { success: true, data: post };
        res.json(response);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            console.error('[PostController] Validation error (Update):', JSON.stringify(err.issues, null, 2));
            console.error('[PostController] Body causing error:', JSON.stringify(req.body, null, 2));
        }
        throw err;
    }
});
