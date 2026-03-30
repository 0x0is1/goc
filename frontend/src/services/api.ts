import { Platform } from 'react-native';
import { auth } from '@services/firebase';
import { Post, Vote, UserProfile, PaginatedResponse, ApiResponse, CancelledPerson, CreateCancelledFields } from '@appTypes/index';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
}

export function clearApiCache() {
    cache.clear();
}

async function fetchApi<T>(endpoint: string, options: RequestInit & { bypassCache?: boolean } = {}): Promise<T> {
    const method = options.method || 'GET';
    const isGet = method.toUpperCase() === 'GET';

    const { bypassCache, ...fetchOptions } = options;

    if (isGet && !bypassCache) {
        const cached = getCached<T>(endpoint);
        if (cached) return cached;
    }

    const token = await auth.currentUser?.getIdToken(true);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3 * 60 * 1000);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...fetchOptions,
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

        if (isGet) {
            setCache(endpoint, data);
        } else {
            cache.clear();
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
    tag?: string,
    bypassCache?: boolean
): Promise<FeedResult> {
    let url = `/posts?limit=10&sort=${sort}`;
    if (cursor) url += `&cursor=${cursor}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;

    const res = await fetchApi<PaginatedResponse<Post>>(url, { bypassCache });
    return {
        posts: res.data || [],
        cursor: res.meta?.cursor || null,
        hasMore: res.meta?.hasMore || false,
    };
}

export async function getPost(id: string, bypassCache?: boolean): Promise<Post> {
    const res = await fetchApi<ApiResponse<Post>>(`/posts/${id}`, { bypassCache });
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

export async function updatePost(id: string, data: CreatePostInput): Promise<Post> {
    const res = await fetchApi<ApiResponse<Post>>(`/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return res.data!;
}

export async function deletePost(id: string): Promise<void> {
    await fetchApi<ApiResponse<null>>(`/posts/${id}`, {
        method: 'DELETE'
    });
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

export async function getUser(userId: string, bypassCache?: boolean): Promise<UserProfile> {
    const res = await fetchApi<ApiResponse<UserProfile>>(`/users/${userId}`, { bypassCache });
    return res.data!;
}

export async function getUserPosts(userId: string, bypassCache?: boolean): Promise<Post[]> {
    const res = await fetchApi<PaginatedResponse<Post>>(`/users/${userId}/posts`, { bypassCache });
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

export interface CancelledFeedResult {
    persons: CancelledPerson[];
    cursor: string | null;
    hasMore: boolean;
}

export async function getCancelledPersons(
    cursor?: string,
    sort: 'latest' | 'top' = 'latest',
    query?: string,
    bypassCache?: boolean
): Promise<CancelledFeedResult> {
    let url = `/cancelled?limit=10&sort=${sort}`;
    if (cursor) url += `&cursor=${cursor}`;
    if (query) url += `&q=${encodeURIComponent(query)}`;

    const res = await fetchApi<PaginatedResponse<CancelledPerson>>(url, { bypassCache });
    return {
        persons: res.data || [],
        cursor: res.meta?.cursor || null,
        hasMore: res.meta?.hasMore || false,
    };
}

export async function getCancelledPerson(id: string, bypassCache?: boolean): Promise<CancelledPerson> {
    const res = await fetchApi<ApiResponse<CancelledPerson>>(`/cancelled/${id}`, { bypassCache });
    return res.data!;
}

export async function createCancelledPerson(data: CreateCancelledFields): Promise<CancelledPerson> {
    const res = await fetchApi<ApiResponse<CancelledPerson>>('/cancelled', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return res.data!;
}

export async function updateCancelledPerson(id: string, data: CreateCancelledFields): Promise<CancelledPerson> {
    const res = await fetchApi<ApiResponse<CancelledPerson>>(`/cancelled/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return res.data!;
}

export async function deleteCancelledPerson(id: string): Promise<void> {
    await fetchApi<ApiResponse<null>>(`/cancelled/${id}`, { method: 'DELETE' });
}

export async function voteCancelledPerson(id: string, type: 'up' | 'down'): Promise<VoteResult> {
    const res = await fetchApi<ApiResponse<VoteResult>>(`/cancelled/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ type })
    });
    return res.data!;
}

export async function getUserSnakeVote(personId: string): Promise<Vote | null> {
    try {
        const res = await fetchApi<ApiResponse<Vote>>(`/cancelled/${personId}/vote`);
        return res.data || null;
    } catch {
        return null;
    }
}

export async function getUserCancelledEnlistments(userId: string, bypassCache?: boolean): Promise<CancelledPerson[]> {
    const res = await fetchApi<PaginatedResponse<CancelledPerson>>(`/cancelled/user/${userId}`, { bypassCache });
    return res.data || [];
}
