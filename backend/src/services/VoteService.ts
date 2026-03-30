import { db } from '@config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { Vote } from '@appTypes/index';

export class VoteService {
    static sanitizeVoteId(userId: string, postId: string): string {
        return userId.replace(/[^a-zA-Z0-9]/g, '_') + '_' + postId;
    }

    static async getVote(userId: string, postId: string): Promise<Vote | null> {
        const voteId = VoteService.sanitizeVoteId(userId, postId);
        const doc = await db.collection('votes').doc(voteId).get();
        if (!doc.exists) return null;
        return { userId, postId, ...doc.data() } as Vote;
    }

    static async castVote(userId: string, postId: string, type: 'up' | 'down'): Promise<void> {
        const voteId = VoteService.sanitizeVoteId(userId, postId);
        const voteRef = db.collection('votes').doc(voteId);
        const postRef = db.collection('posts').doc(postId);

        const postSnap = await postRef.get();
        if (!postSnap.exists) throw new Error('Post not found');
        const post = postSnap.data() as any;
        const authorRef = db.collection('users').doc(post.authorId);
        const voterRef = db.collection('users').doc(userId);

        await db.runTransaction(async (tx) => {
            // All reads FIRST — Firestore requires this
            const [voteDoc, authorDoc, voterDoc] = await Promise.all([
                tx.get(voteRef),
                tx.get(authorRef),
                tx.get(voterRef),
            ]);

            const currentUpvotes = post.upvotes ?? 0;
            const currentDownvotes = post.downvotes ?? 0;
            const currentKarma = authorDoc.data()?.upvotesReceived ?? 0;
            const currentGiven = voterDoc.data()?.upvotesGiven ?? 0;

            // CASE 1: New vote
            if (!voteDoc.exists) {
                tx.set(voteRef, { userId, postId, type, createdAt: FieldValue.serverTimestamp() });
                if (type === 'up') {
                    tx.update(postRef, { upvotes: currentUpvotes + 1 });
                    if (post.authorId !== userId) {
                        tx.update(authorRef, { upvotesReceived: currentKarma + 1 });
                    }
                    tx.update(voterRef, { upvotesGiven: currentGiven + 1 });
                } else {
                    tx.update(postRef, { downvotes: currentDownvotes + 1 });
                }
                return;
            }

            const existingVote = voteDoc.data() as Vote;

            // CASE 2: Unvote (same type clicked again)
            if (existingVote.type === type) {
                tx.delete(voteRef);
                if (type === 'up') {
                    tx.update(postRef, { upvotes: Math.max(0, currentUpvotes - 1) });
                    if (post.authorId !== userId) {
                        tx.update(authorRef, { upvotesReceived: Math.max(0, currentKarma - 1) });
                    }
                    tx.update(voterRef, { upvotesGiven: Math.max(0, currentGiven - 1) });
                } else {
                    tx.update(postRef, { downvotes: Math.max(0, currentDownvotes - 1) });
                }
                return;
            }

            // CASE 3: Switch vote (up→down or down→up)
            tx.update(voteRef, { type });
            if (type === 'up') {
                tx.update(postRef, { upvotes: currentUpvotes + 1, downvotes: Math.max(0, currentDownvotes - 1) });
                if (post.authorId !== userId) {
                    tx.update(authorRef, { upvotesReceived: currentKarma + 1 });
                }
                tx.update(voterRef, { upvotesGiven: currentGiven + 1 });
            } else {
                tx.update(postRef, { downvotes: currentDownvotes + 1, upvotes: Math.max(0, currentUpvotes - 1) });
                if (post.authorId !== userId) {
                    tx.update(authorRef, { upvotesReceived: Math.max(0, currentKarma - 1) });
                }
                tx.update(voterRef, { upvotesGiven: Math.max(0, currentGiven - 1) });
            }
        });
    }

    static async removeVote(userId: string, postId: string): Promise<void> {
        const voteId = VoteService.sanitizeVoteId(userId, postId);
        const voteRef = db.collection('votes').doc(voteId);
        const postRef = db.collection('posts').doc(postId);

        const postSnap = await postRef.get();
        const post = postSnap.exists ? (postSnap.data() as any) : null;
        const authorRef = post ? db.collection('users').doc(post.authorId) : null;
        const voterRef = db.collection('users').doc(userId);

        await db.runTransaction(async (tx) => {
            // All reads FIRST
            const reads: Promise<any>[] = [tx.get(voteRef)];
            if (authorRef) reads.push(tx.get(authorRef));
            reads.push(tx.get(voterRef));
            const [voteDoc, authorDoc, voterDoc] = await Promise.all(reads);

            if (!voteDoc.exists) return;
            const vote = voteDoc.data() as Vote;

            if (post && vote.type === 'up') {
                tx.update(postRef, { upvotes: Math.max(0, (post.upvotes ?? 0) - 1) });
                if (post.authorId !== userId && authorDoc) {
                    tx.update(authorRef!, { upvotesReceived: Math.max(0, (authorDoc.data()?.upvotesReceived ?? 0) - 1) });
                }
                tx.update(voterRef, { upvotesGiven: Math.max(0, (voterDoc.data()?.upvotesGiven ?? 0) - 1) });
            } else if (post) {
                tx.update(postRef, { downvotes: Math.max(0, (post.downvotes ?? 0) - 1) });
            }
            tx.delete(voteRef);
        });
    }
}
