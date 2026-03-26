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

        await db.runTransaction(async (tx) => {
            const [voteDoc, postDoc] = await Promise.all([tx.get(voteRef), tx.get(postRef)]);

            if (!postDoc.exists) throw new Error('Post not found');

            const post = postDoc.data() as { upvotes: number; downvotes: number };
            const currentUpvotes = post.upvotes ?? 0;
            const currentDownvotes = post.downvotes ?? 0;

            if (!voteDoc.exists) {
                tx.set(voteRef, { userId, postId, type, createdAt: FieldValue.serverTimestamp() });
                if (type === 'up') {
                    tx.update(postRef, { upvotes: currentUpvotes + 1 });
                } else {
                    tx.update(postRef, { downvotes: currentDownvotes + 1 });
                }
                return;
            }

            const existingVote = voteDoc.data() as Vote;

            if (existingVote.type === type) {
                tx.delete(voteRef);
                if (type === 'up') {
                    tx.update(postRef, { upvotes: Math.max(0, currentUpvotes - 1) });
                } else {
                    tx.update(postRef, { downvotes: Math.max(0, currentDownvotes - 1) });
                }
                return;
            }

            tx.update(voteRef, { type });
            if (type === 'up') {
                tx.update(postRef, {
                    upvotes: currentUpvotes + 1,
                    downvotes: Math.max(0, currentDownvotes - 1),
                });
            } else {
                tx.update(postRef, {
                    downvotes: currentDownvotes + 1,
                    upvotes: Math.max(0, currentUpvotes - 1),
                });
            }
        });
    }
}
