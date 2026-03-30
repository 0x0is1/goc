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
    articleLink?: string;
    tags?: string[];
    showUserInfo: boolean;
    snapshotScreenshot?: string | null;
    snapshotTimestamp?: string | null;
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

export interface CancelledPerson {
    id: string;
    name: string;
    description: string;
    profession: string;
    images: string[];
    postLinks: string[];
    avatar?: string;
    isIndian: boolean;
    isAnonymous: boolean;
    authorId: string;
    authorName: string;
    upvotes: number;
    downvotes: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface CancelledVote {
    userId: string;
    personId: string;
    type: 'up' | 'down';
    createdAt: Timestamp;
}

export interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    photoURL: string;
    fcmToken?: string;
    upvotesReceived: number;
    upvotesGiven: number;
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
