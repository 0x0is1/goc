import { useCallback, useState } from 'react';
import { getFeed as apiFeed } from '@services/api';
import { Post } from '@appTypes/index';

interface FeedHookState {
    posts: Post[];
    loading: boolean;
    error: string | null;
    cursor: string | null;
    hasMore: boolean;
}

interface FeedHook extends FeedHookState {
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
}

export function useFeed(): FeedHook {
    const [state, setState] = useState<FeedHookState>({
        posts: [],
        loading: true,
        error: null,
        cursor: null,
        hasMore: false,
    });

    const fetchInitial = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const result = await apiFeed();
            setState({ posts: result.posts, loading: false, error: null, cursor: result.cursor, hasMore: result.hasMore });
        } catch {
            setState((prev) => ({ ...prev, loading: false, error: 'Failed to load feed' }));
        }
    }, []);

    const refresh = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const result = await apiFeed();
            setState({ posts: result.posts, loading: false, error: null, cursor: result.cursor, hasMore: result.hasMore });
        } catch {
            setState((prev) => ({ ...prev, loading: false, error: 'Failed to refresh feed' }));
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (!state.hasMore || state.loading) return;
        setState((prev) => ({ ...prev, loading: true }));
        try {
            const result = await apiFeed(state.cursor ?? undefined);
            setState((prev) => ({
                posts: [...prev.posts, ...result.posts],
                loading: false,
                error: null,
                cursor: result.cursor,
                hasMore: result.hasMore,
            }));
        } catch {
            setState((prev) => ({ ...prev, loading: false, error: 'Failed to load more' }));
        }
    }, [state.hasMore, state.loading, state.cursor]);

    const [initialized, setInitialized] = useState(false);
    if (!initialized) {
        setInitialized(true);
        fetchInitial();
    }

    return { ...state, refresh, loadMore };
}

