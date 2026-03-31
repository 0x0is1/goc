import { db } from '@config/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { CancelledPerson, AppError, CancelledVote } from '@appTypes/index';

function makeError(message: string, statusCode: number, code: string): AppError {
    const err = new Error(message) as AppError;
    err.statusCode = statusCode;
    err.code = code;
    return err;
}

interface CancelledFeedResult {
    persons: CancelledPerson[];
    cursor: string | null;
    hasMore: boolean;
}

export class CancelledService {
    static async getFeed(limit: number, cursor?: string, sort: 'latest' | 'top' = 'latest', queryText?: string, userId?: string): Promise<CancelledFeedResult> {
        let query: any = db.collection('cancelled_persons');

        if (sort === 'top') {
            query = query.orderBy('upvotes', 'desc').orderBy('createdAt', 'desc');
        } else {
            query = query.orderBy('createdAt', 'desc');
        }

        if (queryText) {
            query = query.limit(100);
        } else {
            query = query.limit(limit + 1);
        }

        if (cursor) {
            const cursorDoc = await db.collection('cancelled_persons').doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }

        const snapshot = await query.get();
        let allPersons = snapshot.docs.map((doc: any) => CancelledService.serializePerson(doc));

        let filteredPersons = allPersons;
        if (queryText) {
            const lowerQuery = queryText.toLowerCase();
            filteredPersons = allPersons.filter((p: CancelledPerson) => {
                const nameMatch = (p.name || '').toLowerCase().includes(lowerQuery);
                const profMatch = (p.profession || '').toLowerCase().includes(lowerQuery);
                const descMatch = (p.description || '').toLowerCase().includes(lowerQuery);
                return nameMatch || profMatch || descMatch;
            });
        }

        let persons = filteredPersons.slice(0, limit);

        // Fetch user votes if userId is provided
        if (userId && persons.length > 0) {
            const personIds = persons.map((p: CancelledPerson) => p.id);
            const votesSnapshot = await db.collection('cancelled_votes')
                .where('userId', '==', userId)
                .where('personId', 'in', personIds)
                .get();

            const voteMap = new Map();
            votesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                voteMap.set(data.personId, data.type);
            });

            persons = persons.map((p: CancelledPerson) => ({
                ...p,
                userVote: voteMap.get(p.id) || null
            }));
        }

        const hasMore = !queryText && snapshot.docs.length > limit;
        const nextCursor = (hasMore || (queryText && filteredPersons.length > limit))
            ? snapshot.docs[Math.min(snapshot.docs.length - 1, limit)].id
            : (queryText && filteredPersons.length > 0) ? filteredPersons[filteredPersons.length - 1].id : null;

        return { persons, cursor: nextCursor, hasMore };
    }

    static async createPerson(data: any, userId: string, authorName: string): Promise<CancelledPerson> {
        const ref = db.collection('cancelled_persons').doc();
        const now = FieldValue.serverTimestamp();

        const personData = {
            name: data.name,
            description: data.description,
            profession: data.profession,
            images: data.images || [],
            postLinks: data.postLinks || [],
            avatar: data.avatar || null,
            isIndian: typeof data.isIndian === 'boolean' ? data.isIndian : true,
            isAnonymous: typeof data.isAnonymous === 'boolean' ? data.isAnonymous : false,
            authorId: userId,
            authorName,
            upvotes: 0,
            downvotes: 0,
            createdAt: now,
            updatedAt: now,
        };

        await ref.set(personData);
        const created = await ref.get();
        const serialized = CancelledService.serializePerson(created);

        return serialized;
    }

    static async getPerson(id: string): Promise<CancelledPerson> {
        const doc = await db.collection('cancelled_persons').doc(id).get();
        if (!doc.exists) throw makeError('Cancelled person not found', 404, 'NOT_FOUND');
        return CancelledService.serializePerson(doc);
    }

    static async updatePerson(id: string, data: any, requestingUserId: string): Promise<CancelledPerson> {
        const ref = db.collection('cancelled_persons').doc(id);
        const doc = await ref.get();
        if (!doc.exists) throw makeError('Not found', 404, 'NOT_FOUND');

        const person = doc.data()!;
        if (person.authorId !== requestingUserId) {
            throw makeError('Forbidden', 403, 'FORBIDDEN');
        }

        // Always include booleans - fall back to existing DB values if not provided
        const updateData: any = {
            name: data.name,
            description: data.description,
            profession: data.profession,
            images: data.images || [],
            postLinks: data.postLinks || [],
            avatar: data.avatar !== undefined ? (data.avatar || null) : (person.avatar || null),
            isIndian: typeof data.isIndian === 'boolean' ? data.isIndian : (typeof person.isIndian === 'boolean' ? person.isIndian : true),
            isAnonymous: typeof data.isAnonymous === 'boolean' ? data.isAnonymous : (typeof person.isAnonymous === 'boolean' ? person.isAnonymous : false),
            updatedAt: FieldValue.serverTimestamp(),
        };

        console.log(`[CancelledService] Updating person: ${id} isIndian=${updateData.isIndian} isAnonymous=${updateData.isAnonymous}`);
        await ref.update(updateData);
        const updated = await ref.get();
        return CancelledService.serializePerson(updated);
    }

    static async deletePerson(id: string, requestingUserId: string): Promise<void> {
        const person = await CancelledService.getPerson(id);
        if (person.authorId !== requestingUserId) {
            throw makeError('Forbidden', 403, 'FORBIDDEN');
        }
        await db.collection('cancelled_persons').doc(id).delete();
    }

    static async castVote(userId: string, personId: string, type: 'up' | 'down'): Promise<{ upvotes: number; downvotes: number; vote: CancelledVote | null }> {
        const voteId = `v_${userId.replace(/[^a-zA-Z0-9]/g, '_')}_${personId}`;
        const voteRef = db.collection('cancelled_votes').doc(voteId);
        const personRef = db.collection('cancelled_persons').doc(personId);

        // Pre-fetch person outside transaction to resolve authorId without double-reading inside tx
        const personSnap = await personRef.get();
        if (!personSnap.exists) throw makeError('Person not found', 404, 'NOT_FOUND');
        const authorId = personSnap.data()!.authorId;
        const authorRef = db.collection('users').doc(authorId);
        const voterRef = db.collection('users').doc(userId);

        return await db.runTransaction(async (tx) => {
            // All reads FIRST - Firestore requires reads before writes
            const [voteDoc, personDoc, authorDoc, voterDoc] = await Promise.all([
                tx.get(voteRef),
                tx.get(personRef),
                tx.get(authorRef),
                tx.get(voterRef),
            ]);

            if (!personDoc.exists) throw makeError('Person not found', 404, 'NOT_FOUND');
            const person = personDoc.data()!;
            const currentUpvotes = person.upvotes ?? 0;
            const currentDownvotes = person.downvotes ?? 0;
            const currentKarma = authorDoc.data()?.upvotesReceived ?? 0;
            const currentGiven = voterDoc.data()?.upvotesGiven ?? 0;

            // CASE 1: New vote
            if (!voteDoc.exists) {
                tx.set(voteRef, { userId, personId, type, createdAt: FieldValue.serverTimestamp() });
                if (type === 'up') {
                    tx.update(personRef, { upvotes: currentUpvotes + 1 });
                    if (person.authorId !== userId) tx.update(authorRef, { upvotesReceived: currentKarma + 1 });
                    tx.update(voterRef, { upvotesGiven: currentGiven + 1 });
                } else {
                    tx.update(personRef, { downvotes: currentDownvotes + 1 });
                }
                return {
                    upvotes: currentUpvotes + (type === 'up' ? 1 : 0),
                    downvotes: currentDownvotes + (type === 'down' ? 1 : 0),
                    vote: { userId, personId, type, createdAt: new Date() } as any
                };
            }

            const existingVote = voteDoc.data() as CancelledVote;

            // CASE 2: Unvote (same type clicked again)
            if (existingVote.type === type) {
                tx.delete(voteRef);
                if (type === 'up') {
                    tx.update(personRef, { upvotes: Math.max(0, currentUpvotes - 1) });
                    if (person.authorId !== userId) {
                        tx.update(authorRef, { upvotesReceived: Math.max(0, currentKarma - 1) });
                    }
                    tx.update(voterRef, { upvotesGiven: Math.max(0, currentGiven - 1) });
                } else {
                    tx.update(personRef, { downvotes: Math.max(0, currentDownvotes - 1) });
                }
                return {
                    upvotes: Math.max(0, currentUpvotes - (type === 'up' ? 1 : 0)),
                    downvotes: Math.max(0, currentDownvotes - (type === 'down' ? 1 : 0)),
                    vote: null
                };
            }

            // CASE 3: Switch vote (up→down or down→up)
            tx.update(voteRef, { type });
            if (type === 'up') {
                tx.update(personRef, { upvotes: currentUpvotes + 1, downvotes: Math.max(0, currentDownvotes - 1) });
                if (person.authorId !== userId) tx.update(authorRef, { upvotesReceived: currentKarma + 1 });
                tx.update(voterRef, { upvotesGiven: currentGiven + 1 });
            } else {
                tx.update(personRef, { downvotes: currentDownvotes + 1, upvotes: Math.max(0, currentUpvotes - 1) });
                if (person.authorId !== userId) tx.update(authorRef, { upvotesReceived: Math.max(0, currentKarma - 1) });
                tx.update(voterRef, { upvotesGiven: Math.max(0, currentGiven - 1) });
            }
            return {
                upvotes: type === 'up' ? currentUpvotes + 1 : Math.max(0, currentUpvotes - 1),
                downvotes: type === 'down' ? currentDownvotes + 1 : Math.max(0, currentDownvotes - 1),
                vote: { ...existingVote, type } as any
            };
        });
    }

    static async getUserEnlistments(userId: string, limit: number, cursor?: string, requestingUserId?: string): Promise<CancelledFeedResult> {
        let query: any = db
            .collection('cancelled_persons')
            .where('authorId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit + 1);

        if (cursor) {
            const cursorDoc = await db.collection('cancelled_persons').doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }

        const snapshot = await query.get();
        let persons = snapshot.docs.slice(0, limit).map((doc: any) => CancelledService.serializePerson(doc));

        // Fetch user votes if requestingUserId is provided
        if (requestingUserId && persons.length > 0) {
            const personIds = persons.map((p: CancelledPerson) => p.id);
            const votesSnapshot = await db.collection('cancelled_votes')
                .where('userId', '==', requestingUserId)
                .where('personId', 'in', personIds)
                .get();

            const voteMap = new Map();
            votesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                voteMap.set(data.personId, data.type);
            });

            persons = persons.map((p: CancelledPerson) => ({
                ...p,
                userVote: voteMap.get(p.id) || null
            }));
        }
        const hasMore = snapshot.docs.length > limit;
        const nextCursor = hasMore ? snapshot.docs[limit - 1].id : null;

        return { persons, cursor: nextCursor, hasMore };
    }

    static async getUserVote(userId: string, personId: string): Promise<CancelledVote | null> {
        const voteId = `v_${userId.replace(/[^a-zA-Z0-9]/g, '_')}_${personId}`;
        const doc = await db.collection('cancelled_votes').doc(voteId).get();
        return doc.exists ? (doc.data() as CancelledVote) : null;
    }

    private static serializePerson(doc: FirebaseFirestore.DocumentSnapshot): CancelledPerson {
        const data = doc.data()!;
        return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as unknown as CancelledPerson;
    }
}
