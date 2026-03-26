import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { WaybackService } from '@services/WaybackService';
import { AuthenticatedRequest, ApiResponse } from '@appTypes/index';

export const getSnapshot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { url } = req.body as { url: string };
    const waybackUrl = await WaybackService.createSnapshot(url);
    const response: ApiResponse<{ waybackUrl: string | null }> = {
        success: true,
        data: { waybackUrl },
    };
    res.json(response);
});
