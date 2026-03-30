import { useEffect, useState, useCallback } from 'react';
import { getUserPosts, getUser, getUserCancelledEnlistments } from '@services/api';
import { Post, UserProfile, CancelledPerson } from '@appTypes/index';

interface ProfileHook {
    profile: UserProfile | null;
    posts: Post[];
    cancelledEnlistments: CancelledPerson[];
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    refresh: (bypassCache?: boolean) => Promise<void>;
}

export function useProfile(userId: string): ProfileHook {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [cancelledEnlistments, setCancelledEnlistments] = useState<CancelledPerson[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async (bypassCache: boolean = false) => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setError(null);
        if (bypassCache) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const [pResult, postsResult, cancelledResult] = await Promise.all([
                getUser(userId, bypassCache),
                getUserPosts(userId, bypassCache),
                getUserCancelledEnlistments(userId, bypassCache)
            ]);
            setProfile(pResult);
            setPosts(postsResult);
            setCancelledEnlistments(cancelledResult);
        } catch (err: any) {
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, posts, cancelledEnlistments, loading, refreshing, error, refresh: fetchProfile };
}
