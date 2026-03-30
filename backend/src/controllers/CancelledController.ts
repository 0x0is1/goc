import { Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@utils/asyncHandler';
import { CancelledService } from '@services/CancelledService';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse, CancelledPerson } from '@appTypes/index';
import { paginationSchema, createCancelledSchema } from '@utils/validators';

export const listCancelledPersons = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = paginationSchema.parse({
        limit: req.query['limit'],
        cursor: req.query['cursor'],
        sort: req.query['sort'],
    });
    const queryText = req.query['q'] as string | undefined;

    const result = await CancelledService.getFeed(query.limit, query.cursor, query.sort as 'latest' | 'top', queryText);
    const response: PaginatedResponse<CancelledPerson> = {
        success: true,
        data: result.persons,
        meta: { cursor: result.cursor, hasMore: result.hasMore },
    };
    res.json(response);
});

export const getCancelledPerson = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const person = await CancelledService.getPerson(id);
    const response: ApiResponse<CancelledPerson> = { success: true, data: person };
    res.json(response);
});

export const createCancelledPerson = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.uid;
    const authorName = (req.user!.name as string | undefined) ?? 'Anonymous';
    const validatedData = createCancelledSchema.parse(req.body);
    const person = await CancelledService.createPerson(validatedData, userId, authorName);
    const response: ApiResponse<CancelledPerson> = { success: true, data: person };
    res.status(201).json(response);
});

export const updateCancelledPerson = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    try {
        console.log('[CancelledController] req.body for update:', JSON.stringify(req.body, null, 2));
        const validatedData = createCancelledSchema.parse(req.body);
        const person = await CancelledService.updatePerson(id, validatedData, req.user!.uid);
        const response: ApiResponse<CancelledPerson> = { success: true, data: person };
        res.json(response);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            console.error('[CancelledController] Validation error:', JSON.stringify(err.issues, null, 2));
        }
        throw err;
    }
});

export const deleteCancelledPerson = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    await CancelledService.deletePerson(id, req.user!.uid);
    const response: ApiResponse<null> = { success: true };
    res.json(response);
});

export const voteCancelledPerson = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const { type } = req.body;
    const result = await CancelledService.castVote(req.user!.uid, id, type);
    const response: ApiResponse<{ upvotes: number; downvotes: number; vote: any }> = { success: true, data: result };
    res.json(response);
});

export const getCancelledPersonVote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const vote = await CancelledService.getUserVote(req.user!.uid, id);
    const response: ApiResponse<any> = { success: true, data: vote };
    res.json(response);
});

export const getUserEnlistments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = (req.params.userId as string) || req.user!.uid;
    const query = paginationSchema.parse({
        limit: req.query['limit'],
        cursor: req.query['cursor'],
    });
    const result = await CancelledService.getUserEnlistments(userId, query.limit, query.cursor);
    const response: PaginatedResponse<CancelledPerson> = {
        success: true,
        data: result.persons,
        meta: { cursor: result.cursor, hasMore: result.hasMore },
    };
    res.json(response);
});
