export interface Post {
    id: string;
    tweetUrl: string;
    tweetEmbedHtml: string;
    title: string;
    description: string;
    authorName: string;
    authorAvatar: string;
    upvotes: number;
    downvotes: number;
    articleLinks?: string[];
    youtubeLink?: string;
    tags?: string[];
    showUserInfo: boolean;
    snapshotScreenshot?: string;
    snapshotTimestamp?: string;
    authorId: string;
    waybackUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Vote {
    userId: string;
    postId: string;
    type: 'up' | 'down';
    createdAt: string;
}

export interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL: string;
    createdAt: string;
}

export interface FeedState {
    posts: Post[];
    loading: boolean;
    error: string | null;
    cursor: string | null;
    hasMore: boolean;
}

export interface AuthError {
    code: string;
    message: string;
}

export type VoteType = 'up' | 'down';

export type ColorMode = 'light' | 'dark';

export interface CreatePostFields {
    tweetUrl: string;
    title: string;
    description: string;
    articleLinks?: string[];
    youtubeLink?: string;
    tags?: string;
    showUserInfo?: boolean;
}

export interface FieldErrors {
    tweetUrl?: string;
    title?: string;
    description?: string;
    articleLinks?: string;
    youtubeLink?: string;
    tags?: string;
    showUserInfo?: string;
}

export interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    photoURL: string;
    fcmToken?: string;
    upvotesReceived: number;
    upvotesGiven: number;
    createdAt: string;
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
    createdAt: string;
    updatedAt: string;
}

export interface CreateCancelledFields {
    name: string;
    description: string;
    profession: string;
    images: string[];
    postLinks: string[];
    avatar?: string;
    isIndian: boolean;
    isAnonymous: boolean;
}

export interface CancelledFieldErrors {
    name?: string;
    description?: string;
    profession?: string;
    postLinks?: string;
    avatar?: string;
    isIndian?: string;
}
