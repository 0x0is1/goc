import { db } from '@config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { UserProfile } from '@appTypes/index';

export class UserService {
    static async getUser(id: string): Promise<UserProfile | null> {
        const doc = await db.collection('users').doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as UserProfile;
    }

    static async upsertUser(id: string, displayName: string, email: string, photoURL: string): Promise<UserProfile> {
        const ref = db.collection('users').doc(id);
        await db.runTransaction(async (tx) => {
            const doc = await tx.get(ref);
            if (!doc.exists) {
                tx.set(ref, {
                    displayName,
                    email,
                    photoURL,
                    createdAt: FieldValue.serverTimestamp(),
                });
            } else {
                tx.update(ref, { displayName, email, photoURL });
            }
        });
        const updated = await ref.get();
        return { id, ...updated.data() } as UserProfile;
    }
}
