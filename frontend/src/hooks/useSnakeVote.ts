import { useCallback, useEffect, useState } from 'react';
import { voteCancelledPerson, getUserSnakeVote } from '@services/api';
import { VoteType } from '@appTypes/index';
import { useAuthContext } from '@contexts/AuthContext';
import { useToastContext } from '@contexts/ToastContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface SnakeVoteHook {
    currentVote: VoteType | null;
    upvotes: number;
    downvotes: number;
    vote: (type: VoteType) => Promise<void>;
}

export function useSnakeVote(personId: string, initialUpvotes: number, initialDownvotes: number): SnakeVoteHook {
    const { user } = useAuthContext();
    const { showToast } = useToastContext();
    const [currentVote, setCurrentVote] = useState<VoteType | null>(null);
    const [upvotes, setUpvotes] = useState(initialUpvotes);
    const [downvotes, setDownvotes] = useState(initialDownvotes);

    useEffect(() => {
        if (!user) return;
        getUserSnakeVote(personId).then((v) => setCurrentVote(v?.type ?? null));
    }, [personId, user]);

    const vote = useCallback(async (type: VoteType) => {
        if (!user) {
            showToast('Sign in to vote', 'info');
            router.push('/login');
            return;
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Capture current values before async boundary for rollback
        const prevVote = currentVote;
        const prevUp = upvotes;
        const prevDown = downvotes;

        if (currentVote === type) {
            // Optimistic unvote
            setCurrentVote(null);
            setUpvotes((v) => (type === 'up' ? Math.max(0, v - 1) : v));
            setDownvotes((v) => (type === 'down' ? Math.max(0, v - 1) : v));
            try {
                const result = await voteCancelledPerson(personId, type);
                setUpvotes(result.upvotes);
                setDownvotes(result.downvotes);
                setCurrentVote(result.vote?.type ?? null);
            } catch (err) {
                setCurrentVote(prevVote);
                setUpvotes(prevUp);
                setDownvotes(prevDown);
                showToast('Vote failed, please try again', 'error');
            }
        } else {
            // Optimistic new vote or switch
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
                const result = await voteCancelledPerson(personId, type);
                setUpvotes(result.upvotes);
                setDownvotes(result.downvotes);
                setCurrentVote(result.vote?.type ?? null);
            } catch (err) {
                setCurrentVote(prevVote);
                setUpvotes(prevUp);
                setDownvotes(prevDown);
                showToast('Vote failed, please try again', 'error');
            }
        }
        // upvotes/downvotes intentionally excluded - captured via closure for rollback only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, personId, currentVote, showToast]);

    return { currentVote, upvotes, downvotes, vote };
}
