import { useState, useEffect, useCallback } from 'react';
import { getCancelledPerson, getUserSnakeVote, voteCancelledPerson } from '@services/api';
import { CancelledPerson, Vote } from '@appTypes/index';

export function useCancelledPerson(id: string) {
    const [person, setPerson] = useState<CancelledPerson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userVote, setUserVote] = useState<Vote | null>(null);

    const fetchData = useCallback(async (bypassCache = false) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [personData, voteData] = await Promise.all([
                getCancelledPerson(id, bypassCache),
                getUserSnakeVote(id)
            ]);
            setPerson(personData);
            setUserVote(voteData);
        } catch (err: any) {
            setError(err.message || 'Failed to load snake details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleVote = async (type: 'up' | 'down') => {
        if (!person) return;
        try {
            const result = await voteCancelledPerson(person.id, type);
            setPerson(prev => prev ? {
                ...prev,
                upvotes: result.upvotes,
                downvotes: result.downvotes
            } : null);
            setUserVote(result.vote);
            return result;
        } catch (err: any) {
            throw err;
        }
    };

    return {
        person,
        loading,
        error,
        userVote,
        handleVote,
        refresh: () => fetchData(true)
    };
}
