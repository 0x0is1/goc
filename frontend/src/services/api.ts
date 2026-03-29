import { Platform } from 'react-native';
import { auth } from '@services/firebase';
import { Post, Vote, UserProfile, PaginatedResponse, ApiResponse } from '@appTypes/index';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await auth.currentUser?.getIdToken(true);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3 * 60 * 1000);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
            cache: 'no-store',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || `API Error ${response.status}`);
        }
        return data as T;
    } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
    }
}

interface FeedResult {
    posts: Post[];
    cursor: string | null;
    hasMore: boolean;
}

export async function getFeed(
    cursor?: string,
    sort: 'latest' | 'top' = 'latest',
    tag?: string
): Promise<FeedResult> {
    let url = `/posts?limit=10&sort=${sort}`;
    if (cursor) url += `&cursor=${cursor}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;

    const res = await fetchApi<PaginatedResponse<Post>>(url);
    return {
        posts: res.data || [],
        cursor: res.meta?.cursor || null,
        hasMore: res.meta?.hasMore || false,
    };
}

export async function getPost(id: string): Promise<Post> {
    const res = await fetchApi<ApiResponse<Post>>(`/posts/${id}`);
    if (!res.data) throw new Error('Post not found');
    return res.data;
}

interface CreatePostInput {
    tweetUrl: string;
    title: string;
    description: string;
    articleLinks?: string[];
    youtubeLink?: string | null;
    tags?: string[];
    showUserInfo?: boolean;
}

export async function createPost(data: CreatePostInput): Promise<Post> {
    const res = await fetchApi<ApiResponse<Post>>('/posts', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return res.data!;
}

interface VoteResult {
    upvotes: number;
    downvotes: number;
    vote: Vote | null;
}

export async function votePost(postId: string, type: 'up' | 'down'): Promise<VoteResult> {
    const res = await fetchApi<ApiResponse<VoteResult>>(`/votes/${postId}`, {
        method: 'POST',
        body: JSON.stringify({ type })
    });
    return res.data!;
}




export async function removeVote(postId: string): Promise<VoteResult> {
    
    
    const res = await fetchApi<ApiResponse<VoteResult>>(`/votes/${postId}?remove=true`, { method: 'DELETE' }).catch(() => null);
    if (!res) throw new Error("Vote removal not implemented cleanly on backend yet");
    return res.data!;
}

export async function getUserVote(postId: string): Promise<Vote | null> {
    try {
        const res = await fetchApi<ApiResponse<Vote>>(`/votes/${postId}`);
        return res.data || null;
    } catch {
        return null;
    }
}

export async function getUser(userId: string): Promise<UserProfile> {
    const res = await fetchApi<ApiResponse<UserProfile>>(`/users/${userId}`);
    return res.data!;
}

export async function getUserPosts(userId: string): Promise<Post[]> {
    const res = await fetchApi<PaginatedResponse<Post>>(`/users/${userId}/posts`);
    return res.data || [];
}

export async function syncUserProfile(fcmToken?: string): Promise<UserProfile> {
    const res = await fetchApi<ApiResponse<UserProfile>>('/users/sync', {
        method: 'POST',
        body: JSON.stringify(fcmToken ? { fcmToken } : {})
    });
    return res.data!;
}

export async function getWaybackSnapshot(url: string): Promise<{ waybackUrl: string | null }> {
    const res = await fetchApi<ApiResponse<{ waybackUrl: string | null }>>('/wayback/snapshot', {
        method: 'POST',
        body: JSON.stringify({ url }),
    });
    return res.data!;
}
