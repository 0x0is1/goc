import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as {
    firebaseApiKey: string;
    firebaseAuthDomain: string;
    firebaseProjectId: string;
    firebaseStorageBucket: string;
    firebaseMessagingSenderId: string;
    firebaseAppId: string;
} | undefined;

const firebaseConfig = {
    apiKey: extra?.firebaseApiKey ?? '',
    authDomain: extra?.firebaseAuthDomain ?? '',
    projectId: extra?.firebaseProjectId ?? '',
    storageBucket: extra?.firebaseStorageBucket ?? '',
    messagingSenderId: extra?.firebaseMessagingSenderId ?? '',
    appId: extra?.firebaseAppId ?? '',
};

let app: FirebaseApp;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

