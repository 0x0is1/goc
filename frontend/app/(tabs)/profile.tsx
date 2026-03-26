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
import { AVATAR_SIZE_LG } from '@utils/constants';
import { Post } from '@appTypes/index';

export default function ProfileScreen() {
    const { tokens } = useTheme();
    const { user, signOut } = useAuthContext();
    const insets = useSafeAreaInsets();
    const { posts, totalUpvotes, loading } = useProfile(user?.uid ?? '');

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
        paddingTop: insets.top,
    };

    const headerStyle = {
        backgroundColor: tokens.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
        paddingHorizontal: tokens.spacing.lg,
        paddingVertical: tokens.spacing.md,
    };

    if (!user) {
        return (
            <View style={[screenStyle, styles.centered]}>
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
        );
    }

    return (
        <View style={screenStyle}>
            <View style={headerStyle}>
                <DSText size="md" weight="bold" color="textPrimary">Gems of Congress</DSText>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
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
                <DSDivider style={{ marginVertical: tokens.spacing.md }} />
                <DSText size="md" weight="semiBold" color="textPrimary" style={{ marginBottom: tokens.spacing.md }}>
                    My Gems
                </DSText>
                {posts.map((post) => <FeedCard key={post.id} post={post} />)}
                <View style={{ height: tokens.spacing.xl }} />
                <DSButton
                    label="Sign Out"
                    onPress={() => signOut()}
                    variant="ghost"
                    fullWidth
                    accessibilityLabel="Sign out of your account"
                />
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
        paddingHorizontal: 16,
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

