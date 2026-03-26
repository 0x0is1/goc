import React from 'react';
import { View, ScrollView, StyleSheet, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@contexts/ThemeContext';
import { usePost } from '@hooks/usePost';
import { DSText } from '@ds/Text';
import { DSAvatar } from '@ds/Avatar';
import { DSDivider } from '@ds/Divider';
import { DSSkeletonCard } from '@ds/Skeleton';
import { TweetEmbed } from '@components/feed/TweetEmbed';
import { VoteButtons } from '@components/feed/VoteButtons';
import { WaybackButton } from '@components/feed/WaybackButton';
import { ErrorState } from '@components/common/ErrorState';
import { AVATAR_SIZE_MD, TWEET_EMBED_HEIGHT_DETAIL } from '@utils/constants';
import { formatFullDate } from '@utils/formatters';

export default function PostDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { tokens } = useTheme();
    const insets = useSafeAreaInsets();
    const { post, loading, error } = usePost(id ?? '');

    const appBarStyle = {
        backgroundColor: tokens.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
        paddingHorizontal: tokens.spacing.lg,
        paddingTop: insets.top + tokens.spacing.sm,
        paddingBottom: tokens.spacing.md,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
    };

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
    };

    const markdownStyles = {
        body: {
            color: tokens.colors.textPrimary,
            fontSize: tokens.fontSize.base,
            fontFamily: 'PlusJakartaSans_400Regular',
            lineHeight: 22,
        },
    };

    async function handleShare() {
        if (!post) return;
        await Share.share({ title: post.title, message: post.tweetUrl });
    }

    if (loading) {
        return (
            <View style={screenStyle}>
                <View style={appBarStyle}>
                    <Ionicons name="arrow-back" size={22} color={tokens.colors.textPrimary} onPress={() => router.back()} />
                    <DSText size="md" weight="bold" color="textPrimary">Post</DSText>
                    <View style={{ width: 22 }} />
                </View>
                <DSSkeletonCard />
                <DSSkeletonCard />
            </View>
        );
    }

    if (error || !post) {
        return (
            <View style={screenStyle}>
                <View style={appBarStyle}>
                    <Ionicons name="arrow-back" size={22} color={tokens.colors.textPrimary} onPress={() => router.back()} />
                    <View style={{ width: 22 }} />
                </View>
                <ErrorState message={error ?? 'Post not found'} onRetry={() => router.back()} />
            </View>
        );
    }

    return (
        <View style={screenStyle}>
            <View style={appBarStyle}>
                <Ionicons
                    name="arrow-back"
                    size={22}
                    color={tokens.colors.textPrimary}
                    onPress={() => router.back()}
                    accessibilityLabel="Go back"
                />
                <View style={styles.appBarRight}>
                    <Ionicons
                        name="share-outline"
                        size={22}
                        color={tokens.colors.textPrimary}
                        onPress={handleShare}
                        accessibilityLabel="Share post"
                    />
                    <Ionicons
                        name="bookmark-outline"
                        size={22}
                        color={tokens.colors.textPrimary}
                        accessibilityLabel="Bookmark post"
                    />
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={{ gap: tokens.spacing.lg }}>
                    <DSText size="xl" weight="extraBold" color="textPrimary">{post.title}</DSText>
                    <View style={styles.authorRow}>
                        <DSAvatar size={AVATAR_SIZE_MD} uri={post.authorAvatar} name={post.authorName} />
                        <DSText size="md" color="textPrimary">{post.authorName}</DSText>
                        <DSText size="base" color="textMuted">·</DSText>
                        <DSText size="base" color="textMuted">{formatFullDate(post.createdAt)}</DSText>
                    </View>
                    <TweetEmbed html={post.tweetEmbedHtml} height={TWEET_EMBED_HEIGHT_DETAIL} />
                    <Markdown style={markdownStyles}>{post.description}</Markdown>
                    <DSDivider />
                    <View style={styles.actionRow}>
                        <VoteButtons postId={post.id} upvotes={post.upvotes} downvotes={post.downvotes} iconSize={18} />
                        <WaybackButton waybackUrl={post.waybackUrl} />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    appBarRight: { flexDirection: 'row', gap: 16 },
    content: { paddingHorizontal: 16, paddingVertical: 16 },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
});
