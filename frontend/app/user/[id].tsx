import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@contexts/ThemeContext';
import { useProfile } from '@hooks/useProfile';
import { DSText } from '@ds/Text';
import { DSAvatar } from '@ds/Avatar';
import { DSDivider } from '@ds/Divider';
import { FeedCard } from '@components/feed/FeedCard';
import { SnakeCard } from '@components/snakes/SnakeCard';
import { NavBar } from '@components/common/NavBar';
import { DSSkeletonCard } from '@ds/Skeleton';
import { ErrorState } from '@components/common/ErrorState';
import { AVATAR_SIZE_LG } from '@utils/constants';

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { tokens } = useTheme();
    const { posts, cancelledEnlistments, profile, loading, error, refresh } = useProfile(id ?? '');
    const [activeTab, setActiveTab] = React.useState<'posts' | 'snakes'>('posts');
    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh(true);
        setRefreshing(false);
    };

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
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.accent} />
                }
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: tokens.layout.screenPaddingBottom }
                ]}
            >
                <View style={styles.profileSection}>
                    <DSAvatar size={AVATAR_SIZE_LG} uri={authorAvatar} name={authorName} />
                    <DSText size="xl" weight="bold" color="textPrimary">@{authorName}</DSText>
                </View>

                <View style={[styles.statsCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
                    <View style={styles.statBox}>
                        <DSText size="lg" weight="extraBold" color="textPrimary">{String(posts.length)}</DSText>
                        <DSText size="xs" weight="bold" color="textMuted">POSTS</DSText>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: tokens.colors.border }]} />
                    <View style={styles.statBox}>
                        <DSText size="lg" weight="extraBold" color="textPrimary">{String(profile?.upvotesGiven || 0)}</DSText>
                        <DSText size="xs" weight="bold" color="textMuted">UPVOTED</DSText>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: tokens.colors.border }]} />
                    <View style={styles.statBox}>
                        <DSText size="lg" weight="extraBold" color="textPrimary">{String(cancelledEnlistments.length)}</DSText>
                        <DSText size="xs" weight="bold" color="textMuted">SNAKES</DSText>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: tokens.colors.border }]} />
                    <View style={styles.statBox}>
                        <DSText size="lg" weight="extraBold" style={{ color: tokens.colors.accent }}>{String((profile?.upvotesReceived || 0) * 10)}</DSText>
                        <DSText size="xs" weight="bold" color="textMuted">KARMA</DSText>
                    </View>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('posts')}
                        style={[styles.tab, activeTab === 'posts' && { borderBottomColor: tokens.colors.accent, borderBottomWidth: 3 }]}
                    >
                        <DSText size="base" weight="bold" color={activeTab === 'posts' ? 'accent' : 'textMuted'}>Posts</DSText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('snakes')}
                        style={[styles.tab, activeTab === 'snakes' && { borderBottomColor: tokens.colors.accent, borderBottomWidth: 3 }]}
                    >
                        <DSText size="base" weight="bold" color={activeTab === 'snakes' ? 'accent' : 'textMuted'}>Snakes</DSText>
                    </TouchableOpacity>
                </View>

                <View style={{ paddingVertical: 8 }}>
                    {activeTab === 'posts' ? (
                        posts.length > 0 ? (
                            posts.map((post) => <FeedCard key={post.id} post={post} />)
                        ) : (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <DSText size="base" color="textMuted">No posts yet.</DSText>
                            </View>
                        )
                    ) : (
                        cancelledEnlistments.length > 0 ? (
                            <View style={{ paddingTop: 8 }}>
                                {cancelledEnlistments.map((person) => (
                                    <SnakeCard key={person.id} person={person} onRefresh={refresh} />
                                ))}
                            </View>
                        ) : (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <DSText size="base" color="textMuted">No snakes yet.</DSText>
                            </View>
                        )
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
        marginBottom: 24,
    },
    statsCard: {
        flexDirection: 'row',
        marginHorizontal: 16,
        paddingVertical: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 30,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 32,
        marginBottom: 8,
    },
    tab: {
        paddingVertical: 10,
    },
});
