import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '@services/firebase';
import { AuthError } from '@appTypes/index';

GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
});

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<AuthError | null>;
    signInWithGoogle: () => Promise<AuthError | null>;
    signOut: () => Promise<AuthError | null>;
    register: (name: string, email: string, password: string) => Promise<AuthError | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[AuthContext] Attaching onAuthStateChanged listener');
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('[AuthContext] onAuthStateChanged fired. User:', firebaseUser?.uid || 'null');
            setUser(firebaseUser);
            setLoading(false);

            if (firebaseUser) {
                try {
                    console.log('[AuthContext] User is logged in, fetching FCM token & syncing profile...');
                    
                    const { syncUserProfile } = require('@services/api');
                    const { Platform } = require('react-native');
                    const Notifications = require('expo-notifications');

                    let fcmToken = undefined;
                    try {
                        if (Platform.OS === 'android') {
                            const result = await Notifications.getDevicePushTokenAsync();
                            fcmToken = result.data;
                        } else {
                            const result = await Notifications.getExpoPushTokenAsync();
                            fcmToken = result.data;
                        }
                    } catch (e) {
                        console.log('[AuthContext] Push Token restricted or unconfigured', e);
                    }

                    console.log('[AuthContext] Calling syncUserProfile...');
                    await syncUserProfile(fcmToken);
                    console.log('[AuthContext] Profile synced successfully');
                } catch (err) {
                    console.error('[AuthContext] Failed to sync user profile with backend', err);
                }
            }
        });
        return unsubscribe;
    }, []);

    async function signInWithEmail(email: string, password: string): Promise<AuthError | null> {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return null;
        } catch (err) {
            const e = err as { code?: string; message?: string };
            return { code: e.code ?? 'auth/unknown', message: e.message ?? 'Sign in failed' };
        }
    }

    async function signInWithGoogle(): Promise<AuthError | null> {
        try {
            console.log('[AuthContext] Starting Google Sign-In flow...');
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;
            console.log('[AuthContext] Got Google response, idToken length:', idToken?.length || 0);
            if (!idToken) throw new Error('No ID token found');

            console.log('[AuthContext] Passing idToken to Firebase auth...');
            const { GoogleAuthProvider, signInWithCredential } = require('firebase/auth');
            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, credential);
            console.log('[AuthContext] Successfully authenticated with Firebase!');
            return null;
        } catch (err) {
            console.error('[AuthContext] Google sign-in caught error:', err);
            const e = err as { code?: string; message?: string };
            return { code: e.code ?? 'auth/google-failed', message: e.message ?? 'Google sign in failed' };
        }
    }

    async function signOut(): Promise<AuthError | null> {
        try {
            await firebaseSignOut(auth);
            return null;
        } catch (err) {
            const e = err as { code?: string; message?: string };
            return { code: e.code ?? 'auth/unknown', message: e.message ?? 'Sign out failed' };
        }
    }

    async function register(name: string, email: string, password: string): Promise<AuthError | null> {
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName: name });
            return null;
        } catch (err) {
            const e = err as { code?: string; message?: string };
            return { code: e.code ?? 'auth/unknown', message: e.message ?? 'Registration failed' };
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithGoogle, signOut, register }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
    return ctx;
}

