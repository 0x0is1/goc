import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { useVote } from '@hooks/useVote';
import { VoteType } from '@appTypes/index';

interface VoteButtonsProps {
    postId: string;
    upvotes: number;
    downvotes: number;
    iconSize?: number;
}

export function VoteButtons({ postId, upvotes, downvotes, iconSize = 16 }: VoteButtonsProps) {
    const { tokens } = useTheme();
    const { currentVote, upvotes: currentUpvotes, downvotes: currentDownvotes, vote } = useVote(postId, upvotes, downvotes);

    const upColor = currentVote === 'up' ? tokens.colors.accent : tokens.colors.textMuted;
    const downColor = currentVote === 'down' ? tokens.colors.accent : tokens.colors.textMuted;

    return (
        <View style={styles.row}>
            <View style={styles.voteGroup}>
                <View accessibilityLabel="Upvote" accessibilityRole="button" style={styles.iconBtn}>
                    <Ionicons name="arrow-up" size={iconSize} color={upColor} onPress={() => vote('up' as VoteType)} />
                </View>
                <DSText size="sm" color="textMuted">{String(currentUpvotes)}</DSText>
            </View>
            <View style={styles.voteGroup}>
                <View accessibilityLabel="Downvote" accessibilityRole="button" style={styles.iconBtn}>
                    <Ionicons name="arrow-down" size={iconSize} color={downColor} onPress={() => vote('down' as VoteType)} />
                </View>
                <DSText size="sm" color="textMuted">{String(currentDownvotes)}</DSText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    voteGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconBtn: {
        padding: 2,
    },
});

