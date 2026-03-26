import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { DSAvatar } from '@ds/Avatar';
import { VoteButtons } from '@components/feed/VoteButtons';
import { WaybackButton } from '@components/feed/WaybackButton';
import { useRelativeTime } from '@hooks/useRelativeTime';
import { Post } from '@appTypes/index';
import { AVATAR_SIZE_SM, TWEET_EMBED_HEIGHT_FEED } from '@utils/constants';

interface FeedCardProps {
    post: Post;
}

export function FeedCard({ post }: FeedCardProps) {
    const { tokens } = useTheme();
    const relativeTime = useRelativeTime(post.createdAt);

    const cardStyle = {
        backgroundColor: tokens.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
        paddingHorizontal: tokens.spacing.lg,
        paddingVertical: tokens.spacing.md,
    };

    const tweetPlaceholderStyle = {
        height: TWEET_EMBED_HEIGHT_FEED,
        backgroundColor: tokens.colors.surface2,
        borderRadius: tokens.radius.sm,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 4,
    };

    return (
        <TouchableOpacity
            onPress={() => router.push(`/post/${post.id}`)}
            accessibilityLabel={`Open post: ${post.title}`}
            accessibilityRole="button"
        >
            <View style={cardStyle}>
                <View style={styles.inner}>
                    <DSText size="md" weight="bold" color="textPrimary" numberOfLines={2}>{post.title}</DSText>
                    <View style={tweetPlaceholderStyle}>
                        <Ionicons name="logo-twitter" size={24} color={tokens.colors.accent} />
                        <DSText size="xs" color="textMuted">Embedded Tweet</DSText>
                    </View>
                    <DSText size="base" color="textMuted" numberOfLines={3} ellipsizeMode="tail">{post.description}</DSText>
                    <View style={styles.actionRow}>
                        <View style={styles.metaRow}>
                            <DSAvatar size={AVATAR_SIZE_SM} uri={post.authorAvatar} name={post.authorName} />
                            <DSText size="sm" color="textMuted">{post.authorName}</DSText>
                            <DSText size="sm" color="textMuted">·</DSText>
                            <DSText size="sm" color="textMuted">{relativeTime}</DSText>
                        </View>
                        <View style={styles.actions}>
                            <VoteButtons postId={post.id} upvotes={post.upvotes} downvotes={post.downvotes} iconSize={16} />
                            <WaybackButton waybackUrl={post.waybackUrl} />
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    inner: {
        gap: 8,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        flexWrap: 'wrap',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
});

