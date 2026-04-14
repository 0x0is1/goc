import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { DSBadge } from '@ds/Badge';
import { CancelledPerson } from '@appTypes/index';
import { useSnakeVote } from '@hooks/useSnakeVote';
import { useFeedback } from '@contexts/FeedbackContext';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';

interface SnakeListItemProps {
    person: CancelledPerson;
    rank: number;
    onRefresh?: () => void;
}

export const SnakeListItem = memo(function SnakeListItem({ person, rank, onRefresh }: SnakeListItemProps) {
    const { tokens } = useTheme();
    const { playTick, playSuccess } = useFeedback();
    const { currentVote, upvotes, downvotes, vote } = useSnakeVote(person.id, person.upvotes, person.downvotes ?? 0);

    const upScale = useSharedValue(1);
    const downScale = useSharedValue(1);

    const upStyle = useAnimatedStyle(() => ({ transform: [{ scale: upScale.value }] }));
    const downStyle = useAnimatedStyle(() => ({ transform: [{ scale: downScale.value }] }));

    const handlePress = () => {
        playTick();
        router.push(`/snake/${person.id}`);
    };

    const handleVote = async (type: 'up' | 'down') => {
        const scale = type === 'up' ? upScale : downScale;
        scale.value = withSequence(
            withSpring(1.08, { damping: 10, stiffness: 220 }),
            withSpring(1, { damping: 12, stiffness: 180 })
        );
        if (type !== currentVote) playSuccess();
        await vote(type as any);
    };

    const upActive = currentVote === 'up';
    const downActive = currentVote === 'down';

    return (
        <Animated.View entering={FadeIn} style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.mainArea}>
                {/* Rank Badge */}
                <View style={[styles.rankBadge, { backgroundColor: tokens.colors.accent }]}>
                    <DSText size="xs" weight="extraBold" color="accentForeground">#{rank}</DSText>
                </View>

                <View style={styles.contentRow}>
                    {person.avatar ? (
                        <Image source={{ uri: person.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: tokens.colors.surface2 }]}>
                            <Ionicons name="person" size={40} color={tokens.colors.textMuted} />
                        </View>
                    )}

                    <View style={styles.info}>
                        <DSText size="xl" weight="extraBold" color="textPrimary" numberOfLines={1}>
                            {person.name}
                        </DSText>
                        <View style={[styles.profBadge, { backgroundColor: tokens.colors.surface2 }]}>
                            <Ionicons name="briefcase-outline" size={12} color={tokens.colors.accent} />
                            <DSText size="xs" weight="bold" color="textMuted">
                                {person.profession.toUpperCase()}
                            </DSText>
                        </View>
                        <View style={styles.badgeContainer}>
                            <DSBadge
                                label={person.isIndian ? "INDIAN NATIVE" : "NON-INDIAN"}
                                variant={person.isIndian ? "solid" : "outline"}
                                color={person.isIndian ? "accent" : "textMuted"}
                                size="sm"
                            />
                        </View>
                    </View>
                </View>
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
                                {upvotes}
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
                                {downvotes}
                            </DSText>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        </Animated.View>
    );
});

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
    rankBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderBottomRightRadius: 16,
        zIndex: 10,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    avatarPlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        gap: 2,
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
    badgeContainer: {
        flexDirection: 'row',
        marginTop: 4,
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

export default SnakeListItem;
