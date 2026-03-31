import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
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
import { FeedbackProvider, useFeedback } from '@contexts/FeedbackContext';
import { registerBackgroundFetchAsync } from '@tasks/backgroundCheck';
import { registerSnakeBackgroundFetchAsync } from '@tasks/backgroundSnakeCheck';
import { usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFeed, getCancelledPersons } from '@services/api';
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
    const { playTick } = useFeedback();
    const pathname = usePathname();

    const [fontsLoaded] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    const [animationComplete, setAnimationComplete] = React.useState(false);
    const [isReady, setIsReady] = React.useState(false);

    // useEffect(() => {
    //     async function setOnboarding() {
    //         await AsyncStorage.setItem('has_seen_onboarding', 'false');
    //     }
    //     setOnboarding();
    // }, []);

    useEffect(() => {
        const prepare = async () => {
            if (fontsLoaded) {
                try {
                    const onboarding = await AsyncStorage.getItem('has_seen_onboarding');
                    if (onboarding !== 'true' && pathname !== '/onboarding') {
                        router.replace('/onboarding');
                    }
                } catch (e) {
                    console.log('Onboarding check failed:', e);
                } finally {
                    SplashScreen.hideAsync();
                }
            }
        };
        prepare();
    }, [fontsLoaded]);

    useEffect(() => {

        if (fontsLoaded && pathname) {
            playTick();
        }
    }, [pathname]);

    useEffect(() => {
        if (user && !authLoading) {
            console.log('[Layout] User detected, registering background tasks...');
            Notifications.requestPermissionsAsync();
            registerBackgroundFetchAsync();
            registerSnakeBackgroundFetchAsync();
        }
    }, [user, authLoading]);

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

            try {
                const result = await getCancelledPersons(undefined, 'latest', undefined, true);
                if (result.persons && result.persons.length > 0) {
                    await AsyncStorage.setItem('last_seen_snake_id', result.persons[0].id);
                }
            } catch (err) {
                console.log('Failed to sync last seen snake:', err);
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
            >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="snake-enlist" options={{ presentation: 'modal' }} />
                <Stack.Screen name="create" options={{ presentation: 'modal' }} />
                <Stack.Screen name="login" options={{ presentation: 'modal' }} />
                <Stack.Screen name="register" options={{ presentation: 'modal' }} />
                <Stack.Screen name="post/[id]" />
                <Stack.Screen name="user/[id]" />
            </Stack>
        </View>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <FeedbackProvider>
                            <ToastProvider>
                                <KeyboardProvider>
                                    <RootLayoutInner />
                                </KeyboardProvider>
                            </ToastProvider>
                        </FeedbackProvider>
                    </AuthProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
});

