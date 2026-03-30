import React, { useCallback, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@contexts/ThemeContext';
import { useAuthContext } from '@contexts/AuthContext';
import { useProfile } from '@hooks/useProfile';
import { DSText } from '@ds/Text';
import { DSButton } from '@ds/Button';
import { DSAvatar } from '@ds/Avatar';
import { DSDivider } from '@ds/Divider';
import { FeedCard } from '@components/feed/FeedCard';
import { SnakeCard } from '@components/snakes/SnakeCard';
import { DSSkeletonCard } from '@ds/Skeleton';
import { AVATAR_SIZE_LG } from '@utils/constants';
import { NavBar } from '@components/common/NavBar';
import { useFeedback } from '@contexts/FeedbackContext';
import * as Notifications from 'expo-notifications';

export default function ProfileScreen() {
    const { tokens, colorMode, toggleTheme } = useTheme();
    const { user, signOut } = useAuthContext();
    const { profile, posts, cancelledEnlistments, loading, refresh } = useProfile(user?.uid ?? '');
    const { playClick, playTick } = useFeedback();

    const [activeTab, setActiveTab] = useState<'posts' | 'snakes'>('posts');
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (user?.uid) {
                refresh(true); // Always bypass cache to get fresh stats
            }
        }, [user?.uid, refresh])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh(true);
        setRefreshing(false);
    };

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
    };

    const navRight = (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => {
                playClick();
                handleTestNotification();
            }} style={{ padding: 4 }}>
                <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={tokens.colors.textPrimary}
                />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
                playTick();
                toggleTheme();
            }} style={{ padding: 4 }}>
                <Ionicons
                    name={colorMode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                    size={22}
                    color={tokens.colors.textPrimary}
                />
            </TouchableOpacity>
        </View>
    );

    const handleTestNotification = async () => {
        await Notifications.scheduleNotificationAsync({
            content: { title: 'Test Notification', body: 'Syncing your profile!' },
            trigger: null,
        });
    };

    if (!user) {
        return (
            <View style={screenStyle}>
                <NavBar title='My Profile' rightElement={navRight} />
                <View style={[styles.centered, { flex: 1 }]}>
                    <Ionicons name="person-circle-outline" size={80} color={tokens.colors.textMuted} />
                    <DSText size="xl" weight="extraBold" color="textPrimary">Join the Conversation</DSText>
                    <DSText size="base" color="textMuted">Sign in to track your posts and vote on controversies.</DSText>
                    <DSButton label="Sign In" onPress={() => router.push('/login')} fullWidth variant="solid" />
                    <DSButton label="Register" onPress={() => router.push('/register')} fullWidth variant="outline" />
                </View>
            </View>
        );
    }

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons
                name={activeTab === 'posts' ? "document-text-outline" : "bug-outline"}
                size={48}
                color={tokens.colors.textMuted}
                style={{ marginBottom: 12 }}
            />
            <DSText size="base" color="textMuted">
                {activeTab === 'posts' ? "You haven't posted anything yet." : "You haven't exposed any snakes yet."}
            </DSText>
            <DSButton
                label={activeTab === 'posts' ? "Add a Post" : "Expose a Snake"}
                variant="ghost"
                onPress={() => router.push(activeTab === 'posts' ? '/create' : '/snake-enlist')}
            />
        </View>
    );

    const renderContent = () => {
        if (loading && !refreshing && posts.length === 0 && cancelledEnlistments.length === 0) {
            return (
                <View style={{ padding: 16 }}>
                    <DSSkeletonCard />
                    <DSSkeletonCard />
                </View>
            );
        }

        if (activeTab === 'posts') {
            return posts.length > 0 ? (
                <View style={{ gap: 0 }}>
                    {posts.map((post) => <FeedCard key={post.id} post={post} />)}
                </View>
            ) : renderEmptyState();
        } else {
            return cancelledEnlistments.length > 0 ? (
                <View style={{ paddingTop: 8 }}>
                    {cancelledEnlistments.map((person) => (
                        <SnakeCard key={person.id} person={person} onRefresh={refresh} />
                    ))}
                </View>
            ) : renderEmptyState();
        }
    };

    return (
        <View style={screenStyle}>
            <NavBar rightElement={navRight} title='My Profile' />
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.accent} />
                }
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: tokens.layout.screenPaddingBottom + 40 }
                ]}
            >
                {/* Profile Header */}
                <View style={styles.headerSection}>
                    <DSAvatar
                        size={AVATAR_SIZE_LG}
                        uri={user.photoURL ?? undefined}
                        name={user.displayName ?? 'User'}
                    />
                    <DSText size="xl" weight="bold" color="textPrimary" style={{ marginTop: 12 }}>
                        {user.displayName || 'Contributor'}
                    </DSText>
                    <DSText size="sm" color="textMuted">{user.email}</DSText>
                </View>

                {/* Stats Row */}
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

                <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
                    <DSButton
                        label="Sign Out"
                        onPress={() => signOut()}
                        variant="outline"
                        fullWidth
                        leftIcon={<Ionicons name="log-out-outline" size={18} color={tokens.colors.textPrimary} />}
                    />
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        onPress={() => { playTick(); setActiveTab('posts'); }}
                        style={[styles.tab, activeTab === 'posts' && { borderBottomColor: tokens.colors.accent, borderBottomWidth: 3 }]}
                    >
                        <DSText size="base" weight="bold" color={activeTab === 'posts' ? 'accent' : 'textMuted'}>My Posts</DSText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { playTick(); setActiveTab('snakes'); }}
                        style={[styles.tab, activeTab === 'snakes' && { borderBottomColor: tokens.colors.accent, borderBottomWidth: 3 }]}
                    >
                        <DSText size="base" weight="bold" color={activeTab === 'snakes' ? 'accent' : 'textMuted'}>My Snakes</DSText>
                    </TouchableOpacity>
                </View>

                <View style={styles.listSection}>
                    {renderContent()}
                </View>
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
        paddingVertical: 20,
    },
    headerSection: {
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
        marginBottom: 16,
    },
    tab: {
        paddingVertical: 10,
    },
    listSection: {
        minHeight: 300,
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
