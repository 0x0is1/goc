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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Automatically hit the backend to create/sync Postgres/Firestore records
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
                        console.log('Push Token restricted or unconfigured', e);
                    }

                    await syncUserProfile(fcmToken);
                } catch (err) {
                    console.error('Failed to sync user profile with backend', err);
                }
            }
            setUser(firebaseUser);
            setLoading(false);
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
            await GoogleSignin.hasPlayServices();
            await GoogleSignin.signIn();
            return null;
        } catch (err) {
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

