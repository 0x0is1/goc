import { db } from '@config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { UserProfile } from '@appTypes/index';

export class UserService {
    static async getUser(id: string): Promise<UserProfile | null> {
        const doc = await db.collection('users').doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as UserProfile;
    }

    static async upsertUser(id: string, displayName: string, email: string, photoURL: string, fcmToken?: string): Promise<UserProfile> {
        const ref = db.collection('users').doc(id);
        await db.runTransaction(async (tx) => {
            const doc = await tx.get(ref);
            const payload: any = { displayName, email, photoURL };
            if (fcmToken) payload.fcmToken = fcmToken;

            if (!doc.exists) {
                payload.createdAt = FieldValue.serverTimestamp();
                payload.upvotesReceived = 0;
                payload.upvotesGiven = 0;
                tx.set(ref, payload);
            } else {
                tx.update(ref, payload);
            }
        });
        const updated = await ref.get();
        return { id, ...updated.data() } as UserProfile;
    }

    static async getAllFcmTokens(): Promise<string[]> {
        const snapshot = await db.collection('users').where('fcmToken', '!=', null).get();
        return snapshot.docs.map(doc => doc.data().fcmToken).filter(Boolean);
    }
}
