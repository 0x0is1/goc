import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
import { deletePost } from '@services/api';
import { MarkdownBody } from '@components/common/MarkdownBody';

interface FeedCardProps {
  post: Post;
  refreshKey?: string | number;
}

export const FeedCard = memo(({ post, refreshKey }: FeedCardProps) => {
  const { tokens } = useTheme();
  const { user } = useAuthContext();
  const relativeTime = useRelativeTime(post.createdAt);
  const { playTick } = useFeedback();

  const isOwner = user?.uid === post.authorId;

  const handleUserPress = () => {
    playTick();
    if (post.authorName.toLowerCase() === 'anonymous') {
      return;
    }
    if (isOwner) {
      router.push('/profile');
    } else {
      router.push(`/user/${post.authorId}`);
    }
  };

  const handleDelete = () => {
    playTick();
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(post.id);
              Alert.alert('Success', 'Post deleted successfully. Please refresh the feed.');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete post.');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    playTick();
    router.push({
      pathname: '/create',
      params: { editId: post.id }
    });
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
            <View style={styles.headerActions}>
              {isOwner && (
                <View style={styles.ownerActions}>
                  <TouchableOpacity onPress={handleEdit} style={[styles.actionIcon, { backgroundColor: tokens.colors.surface2 }]}>
                    <Ionicons name="pencil-outline" size={14} color={tokens.colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} style={[styles.actionIcon, { backgroundColor: tokens.colors.surface2 }]}>
                    <Ionicons name="trash-outline" size={14} color={tokens.colors.accent} />
                  </TouchableOpacity>
                </View>
              )}
              <DSText size="xs" color="textMuted">
                {relativeTime}
              </DSText>
            </View>
          </View>

          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {post.tags.slice(0, 3).map(tag => (
                <DSBadge
                  key={tag}
                  label={tag.replace(/^#/, '')}
                  variant="solid"
                  size="sm"
                  textStyle={{ fontSize: 10 }}
                  onPress={() => router.push({ pathname: '/', params: { tag } })}
                />
              ))}
              {post.tags.length > 3 && (
                <DSText size="xs" color="textMuted">+{post.tags.length - 3}</DSText>
              )}
            </View>
          )}

          <MarkdownBody maxLines={4} compact containerStyle={{ marginBottom: tokens.spacing.sm }}>
            {post.description.length > 200 ? post.description.substring(0, 200) + '...' : post.description ?? ''}
          </MarkdownBody>

          <TweetEmbed
            tweetUrl={post.tweetUrl}
            html={post.tweetEmbedHtml}
            interactive={false}
            refreshKey={refreshKey}
          />
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
});

FeedCard.displayName = 'FeedCard';

const styles = StyleSheet.create({
  inner: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
    justifyContent: 'flex-end',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 5,
    marginTop: 0,
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
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 4,
  }
});