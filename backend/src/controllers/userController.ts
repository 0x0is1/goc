import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { UserService } from '@services/UserService';
import { PostService } from '@services/PostService';
import { AuthenticatedRequest, ApiResponse, UserProfile, PaginatedResponse, Post } from '@appTypes/index';
import { paginationSchema } from '@utils/validators';

export const getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const user = await UserService.getUser(id);
    if (!user) {
        const response: ApiResponse<null> = { success: false, error: 'User not found', code: 'NOT_FOUND' };
        res.status(404).json(response);
        return;
    }
    const { email, ...publicProfile } = user;
    res.json({ success: true, data: publicProfile });
});

export const syncUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const displayName = (req.user!.name as string | undefined) ?? 'Anonymous';
    const email = (req.user!.email as string | undefined) ?? '';
    const photoURL = (req.user!.picture as string | undefined) ?? '';
    const fcmToken = req.body?.fcmToken as string | undefined;
    const user = await UserService.upsertUser(uid, displayName, email, photoURL, fcmToken);
    const response: ApiResponse<UserProfile> = { success: true, data: user };
    res.json(response);
});

export const getUserPosts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const query = paginationSchema.parse({ limit: req.query['limit'], cursor: req.query['cursor'] });
    const result = await PostService.getUserPosts(id, query.limit, query.cursor);
    const response: PaginatedResponse<Post> = {
        success: true,
        data: result.posts,
        meta: { cursor: result.cursor, hasMore: result.hasMore },
    };
    res.json(response);
});
