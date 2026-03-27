import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
    useFonts,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from '@contexts/ThemeContext';
import { AuthProvider, useAuthContext } from '@contexts/AuthContext';
import { ToastProvider } from '@contexts/ToastContext';
import { registerBackgroundFetchAsync } from '@tasks/backgroundCheck';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFeed } from '@services/api';
import { AnimatedSplashScreen } from '@components/common/AnimatedSplashScreen';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

function RootLayoutInner() {
    const { tokens, colorMode } = useTheme();
    const { user, loading: authLoading } = useAuthContext();
    const [fontsLoaded] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    const [animationComplete, setAnimationComplete] = React.useState(false);

    useEffect(() => {
        if (fontsLoaded) {
            // Hide the static expo splash screen as soon as fonts are ready
            // We'll show our animated splash screen over the content
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    // Conditional Background Task Registration
    useEffect(() => {
        if (user && !authLoading) {
            console.log('[Layout] User detected, registering background tasks...');
            Notifications.requestPermissionsAsync();
            registerBackgroundFetchAsync();
        }
    }, [user, authLoading]);

    // Sync last seen post ID when authorized
    useEffect(() => {
        if (!user) return;

        const syncLastSeen = async () => {
            try {
                const { posts } = await getFeed();
                if (posts && posts.length > 0) {
                    await AsyncStorage.setItem('last_seen_post_id', posts[0].id);
                }
            } catch (err) {
                console.log('Failed to sync last seen post:', err);
            }
        };
        syncLastSeen();
    }, [user]);

    if (!fontsLoaded) return null;

    return (
        <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
            <StatusBar style={colorMode === 'dark' ? 'light' : 'dark'} />

            {!animationComplete && (
                <AnimatedSplashScreen onAnimationComplete={() => setAnimationComplete(true)} />
            )}

            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: tokens.colors.background },
                }}
            />
        </View>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            <KeyboardProvider>
                                <RootLayoutInner />
                            </KeyboardProvider>
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
});

