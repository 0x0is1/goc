import React from 'react';
import { View, ScrollView, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@contexts/ThemeContext';
import { useAuthContext } from '@contexts/AuthContext';
import { useProfile } from '@hooks/useProfile';
import { DSText } from '@ds/Text';
import { DSButton } from '@ds/Button';
import { DSAvatar } from '@ds/Avatar';
import { DSDivider } from '@ds/Divider';
import { FeedCard } from '@components/feed/FeedCard';
import * as Notifications from 'expo-notifications';
import { DSSkeletonCard } from '@ds/Skeleton';
import { AVATAR_SIZE_LG } from '@utils/constants';
import { Post } from '@appTypes/index';

import { NavBar } from '@components/common/NavBar';
import { TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
    const { tokens, colorMode, toggleTheme } = useTheme();
    const { user, signOut } = useAuthContext();
    const { posts, totalUpvotes, loading } = useProfile(user?.uid ?? '');

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
    };

    if (!user) {
        return (
            <View style={[screenStyle, styles.centered]}>
                <NavBar />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                    <Ionicons name="search-outline" size={80} color={tokens.colors.textMuted} />
                    <DSText size="xl" weight="extraBold" color="textPrimary">Join the Conversation</DSText>
                    <DSText size="base" color="textMuted">Sign in to track your Gems and vote on controversies.</DSText>
                    <DSButton
                        label="Sign In"
                        onPress={() => router.push('/login')}
                        fullWidth
                        variant="solid"
                        accessibilityLabel="Sign in to your account"
                    />
                    <DSButton
                        label="Register"
                        onPress={() => router.push('/register')}
                        fullWidth
                        variant="outline"
                        accessibilityLabel="Create a new account"
                    />
                </View>
            </View>
        );
    }

    const handleTestNotification = async () => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Test Notification',
                body: 'This is a test notification to verify GOC background service!',
                data: { url: '/(tabs)/' },
            },
            trigger: null,
        });
    };

    const navRight = (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={handleTestNotification} style={{ padding: 4 }}>
                <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={tokens.colors.textPrimary}
                />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme} style={{ padding: 4 }}>
                <Ionicons
                    name={colorMode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                    size={22}
                    color={tokens.colors.textPrimary}
                />
            </TouchableOpacity>
        </View>
    );

    if (loading && posts.length === 0) {
        return (
            <View style={screenStyle}>
                <NavBar rightElement={navRight} />
                <View style={styles.scrollContent}>
                    <DSSkeletonCard />
                    <DSSkeletonCard />
                    <DSSkeletonCard />
                </View>
            </View>
        );
    }

    return (
        <View style={screenStyle}>
            <NavBar rightElement={navRight} />
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: tokens.layout.screenPaddingBottom }
                ]}
            >
                <View style={styles.profileSection}>
                    <DSAvatar size={AVATAR_SIZE_LG} uri={user.photoURL ?? undefined} name={user.displayName ?? 'User'} />
                    <DSText size="xl" weight="bold" color="textPrimary">{user.displayName ?? 'Anonymous'}</DSText>
                    <DSText size="base" color="textMuted">{user.email ?? ''}</DSText>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <DSText size="xl" weight="extraBold" color="textPrimary">{String(posts.length)}</DSText>
                        <DSText size="sm" color="textMuted">Gems</DSText>
                    </View>
                    <View style={styles.statItem}>
                        <DSText size="xl" weight="extraBold" color="textPrimary">{String(totalUpvotes)}</DSText>
                        <DSText size="sm" color="textMuted">Upvotes</DSText>
                    </View>
                </View>
                <View style={{ paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.md }}>
                    <DSButton
                        label="Sign Out"
                        onPress={() => signOut()}
                        variant="outline"
                        fullWidth
                        leftIcon={<Ionicons name="log-out-outline" size={18} color={tokens.colors.textPrimary} />}
                        accessibilityLabel="Sign out of your account"
                    />
                </View>
                <DSDivider style={{ marginVertical: tokens.spacing.md, marginHorizontal: tokens.spacing.md }} />
                <DSText size="md" weight="bold" color="textPrimary" style={{ marginBottom: tokens.spacing.md, marginHorizontal: tokens.spacing.md }}>
                    My Gems
                </DSText>
                <View style={{ gap: 0 }}>
                    {posts.map((post) => <FeedCard key={post.id} post={post} />)}
                </View>
                <View style={{ height: tokens.spacing.xl }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 16,
    },
    scrollContent: {
        paddingVertical: 16,
    },
    profileSection: {
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
        marginBottom: 8,
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
    },

});

