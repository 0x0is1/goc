import { useEffect, useState } from 'react';
import { getUserPosts } from '@services/api';
import { Post } from '@appTypes/index';

interface ProfileHook {
    posts: Post[];
    totalUpvotes: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useProfile(userId: string): ProfileHook {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setError(null);
        try {
            const result = await getUserPosts(userId);
            setPosts(result);
        } catch (err: any) {
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const totalUpvotes = posts.reduce((acc, p) => acc + p.upvotes, 0);

    return { posts, totalUpvotes, loading, error, refresh: fetchProfile };
}

