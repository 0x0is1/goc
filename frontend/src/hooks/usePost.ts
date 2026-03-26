import { useCallback, useEffect, useState } from 'react';
import { getPost as apiGetPost } from '@services/api';
import { Post } from '@appTypes/index';

interface PostHook {
    post: Post | null;
    loading: boolean;
    error: string | null;
}

export function usePost(id: string): PostHook {
    const [state, setState] = useState<PostHook>({ post: null, loading: true, error: null });

    const fetch = useCallback(async () => {
        setState({ post: null, loading: true, error: null });
        try {
            const post = await apiGetPost(id);
            setState({ post, loading: false, error: null });
        } catch {
            setState({ post: null, loading: false, error: 'Failed to load post' });
        }
    }, [id]);

    useEffect(() => { fetch(); }, [fetch]);

    return state;
}

