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
import { formatCompactNumber } from '@utils/formatters';

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
            withSpring(1.08, { damping: 12, stiffness: 250 }),
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
        <Animated.View entering={FadeIn} style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/snake/${person.id}`)} style={styles.mainArea}>
                <View style={styles.contentRow}>
                    {person.avatar ? (
                        <Image source={{ uri: person.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: tokens.colors.surface2 }]}>
                            <Ionicons name="person" size={40} color={tokens.colors.textMuted} />
                        </View>
                    )}

                    <View style={styles.info}>
                        <View style={styles.nameRow}>
                            <DSText size="base" weight="extraBold" color="textPrimary" numberOfLines={1} style={{ flex: 1 }}>
                                {person.name}
                            </DSText>
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

                        <View style={[styles.profBadge, { backgroundColor: tokens.colors.surface2 }]}>
                            <Ionicons name="briefcase-outline" size={12} color={tokens.colors.accent} />
                            <DSText size="xs" weight="bold" color="textMuted">
                                {(person.profession || 'Unknown').toUpperCase()}
                            </DSText>
                        </View>

                        <View style={styles.metaRow}>
                            {person.isIndian ? (
                                <View style={[styles.badge, { backgroundColor: tokens.colors.accent + '22' }]}>
                                    <DSText size="xs" weight="bold" style={{ color: tokens.colors.accent }}>INDIAN NATIVE</DSText>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>

                <MarkdownBody compact containerStyle={{ marginTop: 16 }}>
                    {person.description ?? ''}
                </MarkdownBody>
            </TouchableOpacity>

            <View style={[styles.footer, { borderTopColor: tokens.colors.border }]}>
                <View style={styles.voteRow}>
                    <Animated.View style={[upStyle, { flex: 1 }]}>
                        <TouchableOpacity
                            onPress={() => handleVote('up')}
                            style={[
                                styles.voteBtn,
                                { backgroundColor: upActive ? tokens.colors.accent : tokens.colors.surface2 }
                            ]}
                        >
                            <Ionicons
                                name={upActive ? "arrow-up-circle" : "arrow-up-circle-outline"}
                                size={20}
                                color={upActive ? tokens.colors.accentForeground : tokens.colors.textMuted}
                            />
                            <DSText size="sm" weight="bold" color={upActive ? 'accentForeground' : 'textPrimary'}>
                                {formatCompactNumber(upvotes)}
                            </DSText>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[downStyle, { flex: 1 }]}>
                        <TouchableOpacity
                            onPress={() => handleVote('down')}
                            style={[
                                styles.voteBtn,
                                { backgroundColor: downActive ? tokens.colors.danger : tokens.colors.surface2 }
                            ]}
                        >
                            <Ionicons
                                name={downActive ? "arrow-down-circle" : "arrow-down-circle-outline"}
                                size={20}
                                color={downActive ? tokens.colors.accentForeground : tokens.colors.textMuted}
                            />
                            <DSText size="sm" weight="bold" color={downActive ? 'accentForeground' : 'textPrimary'}>
                                {formatCompactNumber(downvotes)}
                            </DSText>
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
        marginHorizontal: 16,
        marginVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
    },
    mainArea: {
        padding: 20,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        gap: 2,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    profBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 4,
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
    },
    iconBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        borderTopWidth: 1,
        padding: 10,
    },
    voteRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 4,
    },
    voteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 20,
    },
});
