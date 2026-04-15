import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
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
import { deletePost } from '@services/api';
import { useSuggestionCount } from '@hooks/useSuggestionCount';

export default function PostDetail() {
    const { id, showImage } = useLocalSearchParams<{ id: string, showImage?: string }>();
    const { tokens } = useTheme();
    const { user } = useAuthContext();
    const { post, loading, error } = usePost(id ?? '');
    const { count: suggestionCount } = useSuggestionCount(id ?? '');
    const { playClick, playTick } = useFeedback();
    const [tweetStatus, setTweetStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    const handleUserPress = () => {
        if (!post) return;
        if (post.authorName.toLowerCase() === 'anonymous') {
            return;
        }
        if (post.authorId === user?.uid) {
            router.push('/profile');
        } else {
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
            fontSize: 15,
            lineHeight: 26,
            fontFamily: 'Inter-Regular',
        },
        paragraph: {
            marginBottom: 14,
            color: tokens.colors.textPrimary,
        },
        heading1: { color: tokens.colors.textPrimary, fontSize: 22, fontFamily: 'Inter-Bold', marginBottom: 10 },
        heading2: { color: tokens.colors.textPrimary, fontSize: 19, fontFamily: 'Inter-SemiBold', marginBottom: 8 },
        heading3: { color: tokens.colors.textPrimary, fontSize: 17, fontFamily: 'Inter-SemiBold', marginBottom: 6 },
        strong: { color: tokens.colors.textPrimary, fontFamily: 'Inter-Bold' },
        em: { fontStyle: 'italic' as const, color: tokens.colors.textMuted },
        link: { color: tokens.colors.accent, textDecorationLine: 'none' as const },
        blockquote: {
            backgroundColor: tokens.colors.surface2,
            borderLeftWidth: 3,
            borderLeftColor: tokens.colors.accent,
            paddingLeft: 14,
            paddingVertical: 8,
            borderRadius: 4,
            marginVertical: 10,
        },
        code_inline: {
            backgroundColor: tokens.colors.surface2,
            color: tokens.colors.accent,
            fontFamily: 'Inter-Regular',
            fontSize: 13,
            borderRadius: 4,
            paddingHorizontal: 4,
        },
        fence: {
            backgroundColor: tokens.colors.surface2,
            borderWidth: 1,
            borderColor: tokens.colors.border,
            borderRadius: 8,
            padding: 14,
            marginVertical: 10,
        },
        hr: { backgroundColor: tokens.colors.border, height: 1, marginVertical: 14 },
        bullet_list_icon: { color: tokens.colors.accent, marginRight: 8, fontWeight: 'bold' as const },
        ordered_list_icon: { color: tokens.colors.accent, marginRight: 8, fontWeight: 'bold' as const },
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
            <NavBar title="Post" showBack />
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: tokens.layout.screenPaddingBottom }
                ]}
            >
                <View style={{ gap: tokens.spacing.md }}>
                    <DSText size="md" weight="extraBold" color="textPrimary">
                        {post.title}
                    </DSText>

                    <View style={styles.topMetaRow}>
                        <View style={styles.metaLeft}>
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

                        {user?.uid === post.authorId ? (
                            <View style={styles.ownerActions}>
                                {suggestionCount > 0 && (
                                    <TouchableOpacity
                                        onPress={() => router.push(`/suggestions/list/${post.id}`)}
                                        style={[styles.suggestionBadge, { backgroundColor: tokens.colors.accent + '20' }]}
                                    >
                                        <Ionicons name="bulb" size={12} color={tokens.colors.accent} />
                                        <DSText size="xs" weight="bold" color="accent">{suggestionCount}</DSText>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: '/create', params: { editId: post.id } })}
                                    style={[styles.actionIcon, { backgroundColor: tokens.colors.surface2 }]}
                                >
                                    <Ionicons name="pencil-outline" size={16} color={tokens.colors.textMuted} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        playTick();
                                        Alert.alert('Delete Post', 'Are you sure?', [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Delete',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        await deletePost(post.id);
                                                        router.back();
                                                    } catch {
                                                        Alert.alert('Error', 'Failed to delete post.');
                                                    }
                                                }
                                            }
                                        ]);
                                    }}
                                    style={[styles.actionIcon, { backgroundColor: tokens.colors.surface2 }]}
                                >
                                    <Ionicons name="trash-outline" size={16} color={tokens.colors.accent} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: '/create', params: { suggestId: post.id } })}
                                style={[styles.suggestBtn, { backgroundColor: tokens.colors.surface2 }]}
                            >
                                <Ionicons name="bulb-outline" size={14} color={tokens.colors.accent} />
                                <DSText size="xs" weight="bold" color="accent">SUGGEST EDIT</DSText>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.actionRow}>
                        <VoteButtons postId={post.id} upvotes={post.upvotes} downvotes={post.downvotes} iconSize={18} />
                        <WaybackButton
                            waybackUrl={post.waybackUrl}
                            snapshotScreenshot={post.snapshotScreenshot}
                        />
                    </View>

                    <View style={styles.tagList}>
                        {post.tags?.map(tag => (
                            <DSBadge
                                key={tag}
                                label={tag.replace(/^#/, '')}
                                variant="solid"
                                size="sm"
                                textStyle={{ fontSize: 10 }}
                                onPress={() => router.push({ pathname: '/', params: { tag: tag.replace(/^#/, '') } })}
                            />
                        ))}
                    </View>

                    <DSDivider />
                    <TweetEmbed
                        tweetUrl={post.tweetUrl}
                        html={post.tweetEmbedHtml}
                        onLoadStatus={setTweetStatus}
                    />

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

                    <Markdown style={markdownStyles}>{post.description}</Markdown>
                    {post.youtubeLink && <YouTubeEmbed url={post.youtubeLink} />}
                    <DSDivider />

                    <View style={styles.evidenceSection}>
                        <DSText size="sm" weight="bold" color="textMuted" style={{ marginBottom: 16 }}>
                            SOURCES & VERIFICATION
                        </DSText>

                        <View style={styles.urlList}>
                            {post.articleLinks && post.articleLinks
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
                            {tweetStatus === 'error' && post.tweetUrl && (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        playClick();
                                        router.push(post.tweetUrl as any);
                                    }}
                                    style={styles.urlItem}
                                >
                                    <Ionicons name="logo-twitter" size={16} color={tokens.colors.accent} />
                                    <DSText size="sm" weight="medium" color="accent" numberOfLines={1} style={{ flex: 1 }}>
                                        Original Tweet (Deleted Content Reference)
                                    </DSText>
                                </TouchableOpacity>
                            )}
                        </View>
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
        marginTop: 4,
    },
    metaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ownerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 4,
    },
    suggestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
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
        marginBottom: 8,
    },
    evidenceSection: {
        marginTop: 4,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    urlList: {
        gap: 8,
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
        marginTop: 4,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.01)',
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
