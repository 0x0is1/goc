import { DecodedIdToken } from 'firebase-admin/auth';
import { Request } from 'express';
import { Timestamp } from 'firebase-admin/firestore';

export interface Post {
    id: string;
    tweetUrl: string;
    title: string;
    description: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    waybackUrl: string | null;
    upvotes: number;
    downvotes: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Vote {
    userId: string;
    postId: string;
    type: 'up' | 'down';
    createdAt: Timestamp;
}

export interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    photoURL: string;
    createdAt: Timestamp;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: {
        cursor: string | null;
        hasMore: boolean;
    };
}

export interface AuthenticatedRequest extends Request {
    user?: DecodedIdToken;
}

export interface AppError extends Error {
    statusCode: number;
    code: string;
}
