import { Response, NextFunction } from 'express';
import { adminAuth } from '@config/firebase';
import { AuthenticatedRequest, ApiResponse } from '@appTypes/index';

function isValidTokenStructure(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every((p) => p.length > 0);
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const body: ApiResponse<never> = { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
        res.status(401).json(body);
        return;
    }
    const token = authHeader.slice(7);
    if (!isValidTokenStructure(token)) {
        const body: ApiResponse<never> = { success: false, error: 'Invalid token format', code: 'INVALID_TOKEN' };
        res.status(401).json(body);
        return;
    }
    try {
        const decoded = await adminAuth.verifyIdToken(token);
        req.user = decoded;
        next();
    } catch {
        const body: ApiResponse<never> = { success: false, error: 'Invalid or expired token', code: 'TOKEN_EXPIRED' };
        res.status(401).json(body);
    }
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }
    const token = authHeader.slice(7);
    if (!isValidTokenStructure(token)) {
        next();
        return;
    }
    try {
        const decoded = await adminAuth.verifyIdToken(token);
        req.user = decoded;
    } catch {
        
    }
    next();
}
