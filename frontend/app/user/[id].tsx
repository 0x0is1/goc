import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@contexts/ThemeContext';
import { useProfile } from '@hooks/useProfile';
import { DSText } from '@ds/Text';
import { DSAvatar } from '@ds/Avatar';
import { DSDivider } from '@ds/Divider';
import { FeedCard } from '@components/feed/FeedCard';
import { NavBar } from '@components/common/NavBar';
import { DSSkeletonCard } from '@ds/Skeleton';
import { ErrorState } from '@components/common/ErrorState';
import { AVATAR_SIZE_LG } from '@utils/constants';

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { tokens } = useTheme();
    const { posts, profile, loading, error } = useProfile(id ?? '');

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
    };

    if (loading) {
        return (
            <View style={screenStyle}>
                <NavBar title="Profile" showBack />
                <View style={styles.scrollContent}>
                    <DSSkeletonCard />
                    <DSSkeletonCard />
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={screenStyle}>
                <NavBar title="Profile" showBack />
                <ErrorState message={error} />
            </View>
        );
    }

    
    
    const authorName = profile?.displayName || posts[0]?.authorName || 'User';
    const authorAvatar = profile?.photoURL || posts[0]?.authorAvatar;

    return (
        <View style={screenStyle}>
            <NavBar title={`@${authorName}`} showBack />
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: tokens.layout.screenPaddingBottom }
                ]}
            >
                <View style={styles.profileSection}>
                    <DSAvatar size={AVATAR_SIZE_LG} uri={authorAvatar} name={authorName} />
                    <DSText size="xl" weight="bold" color="textPrimary">@{authorName}</DSText>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <DSText size="xl" weight="extraBold" color="textPrimary">{String(posts.length)}</DSText>
                        <DSText size="sm" color="textMuted">Posts</DSText>
                    </View>
                    <View style={styles.statItem}>
                        <DSText size="xl" weight="extraBold" color="textPrimary">{String(profile?.upvotesReceived ?? 0)}</DSText>
                        <DSText size="sm" color="textMuted">Karma</DSText>
                    </View>
                    <View style={styles.statItem}>
                        <DSText size="xl" weight="extraBold" color="textPrimary">{String(profile?.upvotesGiven ?? 0)}</DSText>
                        <DSText size="sm" color="textMuted">Votes Cast</DSText>
                    </View>
                </View>

                <DSDivider style={{ marginVertical: tokens.spacing.md, marginHorizontal: tokens.spacing.md }} />

                <DSText size="md" weight="semiBold" color="textPrimary" style={{ marginBottom: tokens.spacing.md, marginHorizontal: tokens.spacing.md }}>
                    Posts from @{authorName}
                </DSText>

                <View style={{ gap: 0 }}>
                    {posts.length > 0 ? (
                        posts.map((post) => <FeedCard key={post.id} post={post} />)
                    ) : (
                        <DSText size="base" color="textMuted" style={{ textAlign: 'center', marginTop: 32 }}>
                            No posts found for this user.
                        </DSText>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
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
