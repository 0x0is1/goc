import { useCallback, useState, useEffect } from 'react';
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
    setSort: (sort: 'latest' | 'top') => void;
    setTag: (tag: string | null) => void;
    sort: 'latest' | 'top';
    tag: string | null;
}

export function useFeed(initialSort: 'latest' | 'top' = 'latest', initialTag: string | null = null): FeedHook {
    const [sort, setSort] = useState<'latest' | 'top'>(initialSort);
    const [tag, setTag] = useState<string | null>(initialTag);
    const [state, setState] = useState<FeedHookState>({
        posts: [],
        loading: true,
        error: null,
        cursor: null,
        hasMore: false,
    });

    const fetchFeed = useCallback(async (isRefresh: boolean, startCursor?: string) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const result = await apiFeed(startCursor, sort, tag ?? undefined);

            setState((prev) => ({
                posts: isRefresh ? result.posts : [...prev.posts, ...result.posts],
                loading: false,
                error: null,
                cursor: result.cursor,
                hasMore: result.hasMore,
            }));
        } catch (err) {
            console.error('Feed error:', err);
            setState((prev) => ({
                ...prev,
                loading: false,
                error: isRefresh ? 'Failed to refresh feed' : 'Failed to load more'
            }));
        }
    }, [sort, tag]);

    // Initial load and filter changes
    useEffect(() => {
        fetchFeed(true);
    }, [sort, tag, fetchFeed]);

    // Sync from URL params
    useEffect(() => {
        if (initialSort !== sort) setSort(initialSort);
    }, [initialSort]);

    useEffect(() => {
        if (initialTag !== tag) setTag(initialTag);
    }, [initialTag]);

    const refresh = useCallback(async () => {
        await fetchFeed(true);
    }, [fetchFeed]);

    const loadMore = useCallback(async () => {
        if (!state.hasMore || state.loading || !state.cursor) return;
        await fetchFeed(false, state.cursor);
    }, [state.hasMore, state.loading, state.cursor, fetchFeed]);

    return { ...state, refresh, loadMore, setSort, setTag, sort, tag };
}

