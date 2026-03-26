import * as admin from 'firebase-admin';
import { env } from '@config/env';
import logger from '@utils/logger';

let db: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: env.FIREBASE_PROJECT_ID,
        });
    }
    db = admin.firestore();
    adminAuth = admin.auth();
} catch (err) {
    logger.error('Firebase initialization failed', { err });
    process.exit(1);
}

export { db, adminAuth, admin };
