import { useEffect, useState } from 'react';
import { getUserPosts } from '@services/api';
import { Post } from '@appTypes/index';

interface ProfileHook {
    posts: Post[];
    totalUpvotes: number;
    loading: boolean;
}

export function useProfile(userId: string): ProfileHook {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        getUserPosts(userId).then((result) => {
            setPosts(result);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [userId]);

    const totalUpvotes = posts.reduce((acc, p) => acc + p.upvotes, 0);

    return { posts, totalUpvotes, loading };
}

