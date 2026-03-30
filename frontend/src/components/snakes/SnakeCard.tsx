import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Image, Linking, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { useAuthContext } from '@contexts/AuthContext';
import { CancelledPerson } from '@appTypes/index';
import { useFeedback } from '@contexts/FeedbackContext';
import { deleteCancelledPerson } from '@services/api';
import { useSnakeVote } from '@hooks/useSnakeVote';
import { MarkdownBody } from '@components/common/MarkdownBody';

interface SnakeCardProps {
    person: CancelledPerson;
    onRefresh?: () => void;
}

export const SnakeCard = memo(({ person, onRefresh }: SnakeCardProps) => {
    const { tokens, colorMode } = useTheme();
    const { user } = useAuthContext();
    const { playTick, playClick, playSuccess } = useFeedback();

    const { currentVote, upvotes, downvotes, vote } = useSnakeVote(person.id, person.upvotes, person.downvotes ?? 0);

    const upScale = useSharedValue(1);
    const downScale = useSharedValue(1);
    const upStyle = useAnimatedStyle(() => ({ transform: [{ scale: upScale.value }] }));
    const downStyle = useAnimatedStyle(() => ({ transform: [{ scale: downScale.value }] }));

    const isOwner = user?.uid === person.authorId;
    const authorName = person.isAnonymous ? 'Anonymous' : (person.authorName || 'Unknown');
    const upActive = currentVote === 'up';
    const downActive = currentVote === 'down';

    const handleVote = async (type: 'up' | 'down') => {
        const scale = type === 'up' ? upScale : downScale;
        scale.value = withSequence(
            withSpring(1.25, { damping: 12, stiffness: 250 }),
            withSpring(1, { damping: 15, stiffness: 200 })
        );
        if (type !== currentVote) playSuccess();
        else playClick();
        await vote(type);
    };

    const handleDelete = () => {
        playTick();
        Alert.alert('Remove Snake', 'Delete this entry permanently?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try { await deleteCancelledPerson(person.id); onRefresh?.(); }
                    catch { Alert.alert('Error', 'Failed to delete.'); }
                }
            }
        ]);
    };

    const handleEdit = () => {
        playClick();
        router.push({ pathname: '/snake-enlist', params: { editId: person.id } });
    };

    return (
        <Animated.View entering={FadeIn} style={[styles.card, { backgroundColor: tokens.colors.surface, borderBottomColor: tokens.colors.border }]}>

            {/* ── Header Row ─────────────────────────────────────── */}
            <View style={styles.header}>
                {/* Avatar */}
                {person.avatar ? (
                    <Image source={{ uri: person.avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: tokens.colors.surface2 }]}>
                        <Ionicons name="person-outline" size={22} color={tokens.colors.textMuted} />
                    </View>
                )}

                {/* Name + Meta */}
                <View style={styles.headerBody}>
                    <DSText size="base" weight="bold" color="textPrimary" numberOfLines={1}>
                        {person.name}
                    </DSText>
                    <View style={styles.metaRow}>
                        {person.profession ? (
                            <View style={[styles.badge, { backgroundColor: tokens.colors.surface2 }]}>
                                <DSText size="xs" weight="medium" color="textMuted">{person.profession}</DSText>
                            </View>
                        ) : null}
                        {person.isIndian ? (
                            <View style={[styles.badge, { backgroundColor: tokens.colors.accent + '22' }]}>
                                <DSText size="xs" weight="bold" style={{ color: tokens.colors.accent }}>Indian</DSText>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Owner actions */}
                {isOwner && (
                    <View style={styles.ownerActions}>
                        <TouchableOpacity onPress={handleEdit} style={[styles.iconBtn, { backgroundColor: tokens.colors.surface2 }]}>
                            <Ionicons name="pencil" size={13} color={tokens.colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                            <Ionicons name="trash-outline" size={13} color={tokens.colors.danger} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* ── Description ────────────────────────────────────── */}
            <MarkdownBody compact containerStyle={{ marginBottom: 14 }}>
                {person.description ?? ''}
            </MarkdownBody>

            {/* ── Images ─────────────────────────────────────────── */}
            {person.images && person.images.length > 0 && (
                <View style={[styles.gallery, person.images.length === 1 && styles.gallerySingle]}>
                    {person.images.map((img, i) => (
                        <Image
                            key={i}
                            source={{ uri: img }}
                            style={[
                                styles.galleryImg,
                                person.images!.length === 1 && styles.galleryImgFull,
                                { borderColor: tokens.colors.border }
                            ]}
                            resizeMode="cover"
                        />
                    ))}
                </View>
            )}

            {/* ── Post Links ─────────────────────────────────────── */}
            {person.postLinks && person.postLinks.length > 0 && person.postLinks.filter(Boolean).length > 0 && (
                <View style={[styles.linksBox, { backgroundColor: tokens.colors.surface2, borderColor: tokens.colors.border }]}>
                    {person.postLinks.filter(Boolean).map((link, i) => (
                        <TouchableOpacity key={i} style={styles.linkRow} onPress={() => Linking.openURL(link).catch(() => { })}>
                            <Ionicons name="link-outline" size={13} color={tokens.colors.accent} />
                            <DSText size="xs" color="accent" style={styles.linkText} numberOfLines={1}>{link}</DSText>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* ── Footer: author + votes ──────────────────────────── */}
            <View style={[styles.footer, { borderTopColor: tokens.colors.border }]}>
                {/* Author */}
                <DSText size="xs" color="textMuted" weight="medium">by {authorName}</DSText>

                {/* Votes */}
                <View style={styles.voteRow}>
                    <Animated.View style={upStyle}>
                        <TouchableOpacity
                            onPress={() => handleVote('up')}
                            style={[
                                styles.votePill,
                                { backgroundColor: upActive ? tokens.colors.accent + '22' : tokens.colors.surface2 }
                            ]}
                        >
                            <Ionicons name={upActive ? "arrow-up-circle" : "arrow-up-circle-outline"} size={16} color={upActive ? tokens.colors.accent : tokens.colors.textMuted} />
                            <DSText size="xs" weight="bold" style={{ color: upActive ? tokens.colors.accent : tokens.colors.textMuted }}>{upvotes}</DSText>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={downStyle}>
                        <TouchableOpacity
                            onPress={() => handleVote('down')}
                            style={[
                                styles.votePill,
                                { backgroundColor: downActive ? 'rgba(239,68,68,0.15)' : tokens.colors.surface2 }
                            ]}
                        >
                            <Ionicons name={downActive ? "arrow-down-circle" : "arrow-down-circle-outline"} size={16} color={downActive ? tokens.colors.danger : tokens.colors.textMuted} />
                            <DSText size="xs" weight="bold" style={{ color: downActive ? tokens.colors.danger : tokens.colors.textMuted }}>{downvotes}</DSText>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        </Animated.View>
    );
});

SnakeCard.displayName = 'SnakeCard';

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        flexShrink: 0,
    },
    avatarFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBody: {
        flex: 1,
        gap: 4,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    ownerActions: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 2,
    },
    iconBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        lineHeight: 21,
        marginBottom: 14,
    },
    gallery: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    gallerySingle: {
        flexDirection: 'column',
    },
    galleryImg: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
    },
    galleryImgFull: {
        width: '100%',
        height: 200,
        aspectRatio: undefined,
    },
    linksBox: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 10,
        gap: 6,
        marginBottom: 14,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    linkText: {
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    voteRow: {
        flexDirection: 'row',
        gap: 8,
    },
    votePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
});
