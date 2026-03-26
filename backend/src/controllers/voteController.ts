import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { VoteService } from '@services/VoteService';
import { PostService } from '@services/PostService';
import { AuthenticatedRequest, ApiResponse, Vote } from '@appTypes/index';

export const castVote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const postId = req.params.postId as string;
    const { type } = req.body as { type: 'up' | 'down' };
    await VoteService.castVote(req.user!.uid, postId, type);
    const post = await PostService.getPost(postId);
    const response: ApiResponse<{ upvotes: number; downvotes: number }> = {
        success: true,
        data: { upvotes: post.upvotes, downvotes: post.downvotes },
    };
    res.json(response);
});

export const getVote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const postId = req.params.postId as string;
    const vote = await VoteService.getVote(req.user!.uid, postId);
    const response: ApiResponse<Vote | null> = { success: true, data: vote };
    res.json(response);
});
