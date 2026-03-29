import React from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@contexts/ThemeContext';
import { usePost } from '@hooks/usePost';
import { DSText } from '@ds/Text';
import { DSDivider } from '@ds/Divider';
import { DSSkeletonCard } from '@ds/Skeleton';
import { TweetEmbed } from '@components/feed/TweetEmbed';
import { VoteButtons } from '@components/feed/VoteButtons';
import { YouTubeEmbed } from '@components/feed/YouTubeEmbed';
import { DSBadge } from '@ds/Badge';
import { WaybackButton } from '@components/feed/WaybackButton';
import { ErrorState } from '@components/common/ErrorState';
import { formatFullDate } from '@utils/formatters';
import { NavBar } from '@components/common/NavBar';
import { useFeedback } from '@contexts/FeedbackContext';
import { useAuthContext } from '@contexts/AuthContext';

export default function PostDetail() {
    const { id, showImage } = useLocalSearchParams<{ id: string, showImage?: string }>();
    const { tokens, colorMode } = useTheme();
    const { user } = useAuthContext();
    const { post, loading, error } = usePost(id ?? '');
    const { playClick, playTick } = useFeedback();

    const handleUserPress = () => {
        if (post?.authorId === user?.uid) {
            router.push('/profile');
        } else if (post) {
            router.push(`/user/${post.authorId}`);
        }
    };

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
    };

    const markdownStyles = {
        body: {
            color: tokens.colors.textPrimary,
            fontSize: 16,
            lineHeight: 24,
            fontFamily: 'Inter-Regular',
        },
        paragraph: {
            marginBottom: 16,
        },
    };

    if (loading && !post) {
        return (
            <View style={screenStyle}>
                <NavBar title="Loading..." showBack />
                <View style={{ padding: 16 }}>
                    <DSSkeletonCard />
                </View>
            </View>
        );
    }

    if (error || !post) {
        return (
            <View style={screenStyle}>
                <NavBar title="Post missing" showBack />
                <ErrorState message={error ?? 'Post not found'} onRetry={() => router.back()} />
            </View>
        );
    }

    return (
        <View style={screenStyle}>
            <NavBar title="Gem post" showBack />
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: tokens.layout.screenPaddingBottom }
                ]}
            >
                <View style={{ gap: tokens.spacing.md }}>
                    <DSText size="xl" weight="extraBold" color="textPrimary">
                        {post.title}
                    </DSText>

                    <View style={styles.topMetaRow}>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => {
                            playTick();
                            handleUserPress();
                        }} style={styles.authorBadge}>
                            <DSText size="sm" weight="bold" color="accent">@{post.authorName}</DSText>
                        </TouchableOpacity>
                        <DSText size="xs" color="textMuted">
                            {formatFullDate(post.createdAt)}
                        </DSText>
                    </View>

                    <View style={styles.actionRow}>
                        <VoteButtons postId={post.id} upvotes={post.upvotes} downvotes={post.downvotes} iconSize={24} />
                        <WaybackButton
                            waybackUrl={post.waybackUrl}
                            snapshotScreenshot={post.snapshotScreenshot}
                        />
                    </View>

                    <View style={styles.tagList}>
                        {post.tags?.map(tag => (
                            <DSBadge
                                key={tag}
                                label={tag}
                                variant="solid"
                                size="sm"
                                onPress={() => router.push({ pathname: '/', params: { tag } })}
                            />
                        ))}
                    </View>

                    <DSDivider />
                    <TweetEmbed tweetUrl={post.tweetUrl} html={post.tweetEmbedHtml} />
                    <Markdown style={markdownStyles}>{post.description}</Markdown>
                    {post.youtubeLink && <YouTubeEmbed url={post.youtubeLink} />}
                    <DSDivider />

                    <View style={styles.evidenceSection}>
                        <DSText size="sm" weight="bold" color="textMuted" style={{ marginBottom: 16 }}>
                            SOURCES & VERIFICATION
                        </DSText>

                        {post.articleLinks && post.articleLinks.length > 0 && (
                            <View style={styles.urlList}>
                                {post.articleLinks
                                    .filter(link =>
                                        !link.includes('twitter.com') &&
                                        !link.includes('x.com') &&
                                        !link.includes('gemsofcongress.com')
                                    )
                                    .map((link, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                playClick();
                                                router.push(link as any);
                                            }}
                                            style={styles.urlItem}
                                        >
                                            <Ionicons name="newspaper-outline" size={16} color={tokens.colors.accent} />
                                            <DSText size="sm" weight="medium" color="accent" numberOfLines={1} style={{ flex: 1 }}>
                                                {link}
                                            </DSText>
                                        </TouchableOpacity>
                                    ))
                                }
                            </View>
                        )}

                        {post.snapshotScreenshot && (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={styles.snapshotSection}
                                onPress={() => {
                                    playClick();
                                    router.push({ pathname: '/post/[id]', params: { id: post.id, showImage: 'true' } });
                                }}
                            >
                                <DSText size="xs" weight="bold" color="textMuted" style={{ marginBottom: 12 }}>
                                    INTERNAL ARCHIVE SNAPSHOT (TAP TO EXPAND)
                                </DSText>
                                <Image
                                    source={{ uri: post.snapshotScreenshot }}
                                    style={styles.snapshotImage}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>

            {router.canGoBack() && showImage === 'true' && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        onPress={() => {
                            playTick();
                            router.back();
                        }}
                    >
                        <View style={styles.fullImageContainer}>
                            <Image
                                source={{ uri: post.snapshotScreenshot! }}
                                style={{ width: '100%', height: '80%' }}
                                resizeMode="contain"
                            />
                            <DSText color="accentForeground" style={{ marginTop: 20 }}>Tap anywhere to close</DSText>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 16, paddingVertical: 16 },
    topMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: -4,
    },
    authorBadge: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    evidenceSection: {
        marginTop: 12,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    urlList: {
        gap: 8,
        marginBottom: 20,
    },
    urlItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: 12,
        borderRadius: 12,
    },
    snapshotSection: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    snapshotImage: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 8,
    },
    fullImageContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
