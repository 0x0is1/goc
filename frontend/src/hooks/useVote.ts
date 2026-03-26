import { useCallback, useEffect, useState } from 'react';
import { votePost, removeVote, getUserVote } from '@services/api';
import { VoteType } from '@appTypes/index';
import { useAuthContext } from '@contexts/AuthContext';
import { useToastContext } from '@contexts/ToastContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface VoteHook {
    currentVote: VoteType | null;
    upvotes: number;
    downvotes: number;
    vote: (type: VoteType) => Promise<void>;
}

export function useVote(postId: string, initialUpvotes: number, initialDownvotes: number): VoteHook {
    const { user } = useAuthContext();
    const { showToast } = useToastContext();
    const [currentVote, setCurrentVote] = useState<VoteType | null>(null);
    const [upvotes, setUpvotes] = useState(initialUpvotes);
    const [downvotes, setDownvotes] = useState(initialDownvotes);

    useEffect(() => {
        if (!user) return;
        getUserVote(postId).then((v) => setCurrentVote(v?.type ?? null));
    }, [postId, user]);

    const vote = useCallback(async (type: VoteType) => {
        if (!user) {
            showToast('Sign in to vote', 'info');
            router.push('/login');
            return;
        }
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const prevVote = currentVote;
        const prevUp = upvotes;
        const prevDown = downvotes;
        if (currentVote === type) {
            setCurrentVote(null);
            setUpvotes((v) => (type === 'up' ? Math.max(0, v - 1) : v));
            setDownvotes((v) => (type === 'down' ? Math.max(0, v - 1) : v));
            try {
                await removeVote(postId);
            } catch {
                setCurrentVote(prevVote);
                setUpvotes(prevUp);
                setDownvotes(prevDown);
            }
        } else {
            const wasOther = prevVote !== null;
            setCurrentVote(type);
            setUpvotes((v) => {
                if (type === 'up') return v + 1;
                if (wasOther && prevVote === 'up') return Math.max(0, v - 1);
                return v;
            });
            setDownvotes((v) => {
                if (type === 'down') return v + 1;
                if (wasOther && prevVote === 'down') return Math.max(0, v - 1);
                return v;
            });
            try {
                const result = await votePost(postId, type);
                setUpvotes(result.upvotes);
                setDownvotes(result.downvotes);
            } catch {
                setCurrentVote(prevVote);
                setUpvotes(prevUp);
                setDownvotes(prevDown);
            }
        }
    }, [user, postId, currentVote, upvotes, downvotes, showToast]);

    return { currentVote, upvotes, downvotes, vote };
}

