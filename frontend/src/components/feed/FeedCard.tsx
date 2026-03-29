import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  FadeIn
} from 'react-native-reanimated';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { VoteButtons } from '@components/feed/VoteButtons';
import { WaybackButton } from '@components/feed/WaybackButton';
import { TweetEmbed } from '@components/feed/TweetEmbed';
import { useRelativeTime } from '@hooks/useRelativeTime';
import { useAuthContext } from '@contexts/AuthContext';
import { Post } from '@appTypes/index';
import { DSBadge } from '@ds/Badge';
import { useFeedback } from '@contexts/FeedbackContext';

interface FeedCardProps {
  post: Post;
}

export function FeedCard({ post }: FeedCardProps) {
  const { tokens } = useTheme();
  const { user } = useAuthContext();
  const relativeTime = useRelativeTime(post.createdAt);
  const { playTick } = useFeedback();

  const handleUserPress = () => {
    playTick();
    if (post.authorName.toLowerCase() === 'anonymous') {
      return;
    }
    if (post.authorId === user?.uid) {
      router.push('/profile');
    } else {
      router.push(`/user/${post.authorId}`);
    }
  };

  const cardStyle = {
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  };

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={cardStyle}
    >
      <View style={styles.inner}>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            playTick();
            router.push(`/post/${post.id}`);
          }}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <DSText size="md" weight="bold" color="textPrimary" numberOfLines={1} style={{ flexShrink: 1 }}>
                {post.title}
              </DSText>
            </View>
            <DSText size="xs" color="textMuted">
              {relativeTime}
            </DSText>
          </View>

          { }
          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {post.tags.slice(0, 3).map(tag => (
                <DSBadge
                  key={tag}
                  label={tag.replace(/^#/, '')}
                  variant="solid"
                  size="sm"
                  onPress={() => router.push({ pathname: '/', params: { tag } })}
                />
              ))}
              {post.tags.length > 3 && (
                <DSText size="xs" color="textMuted">+{post.tags.length - 3}</DSText>
              )}
            </View>
          )}

          <DSText
            size="base"
            color="textMuted"
            numberOfLines={3}
            ellipsizeMode="tail"
            style={{ marginBottom: tokens.spacing.sm }}
          >
            {post.description}
          </DSText>

          <TweetEmbed tweetUrl={post.tweetUrl} html={post.tweetEmbedHtml} interactive={false} />
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <View style={styles.leftActions}>
            <VoteButtons
              postId={post.id}
              upvotes={post.upvotes}
              downvotes={post.downvotes}
              iconSize={18}
            />
          </View>

          <View style={styles.rightActions}>
            <WaybackButton
              waybackUrl={post.waybackUrl}
              snapshotScreenshot={post.snapshotScreenshot}
            />

            { }
            <View style={styles.sourceIconsContainer}>
              {post.youtubeLink && (
                <View style={styles.iconWrapper}>
                  <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                </View>
              )}
              {post.articleLinks && post.articleLinks.length > 0 && (
                <View style={styles.iconWrapper}>
                  <Ionicons name="newspaper-outline" size={14} color={tokens.colors.accent} />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.metaRow}
              activeOpacity={0.6}
              onPress={post.showUserInfo ? handleUserPress : undefined}
            >
              <DSText size="sm" weight="semiBold" color="textMuted">
                {post.showUserInfo ? `@${post.authorName}` : 'Anonymous'}
              </DSText>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inner: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrapper: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});