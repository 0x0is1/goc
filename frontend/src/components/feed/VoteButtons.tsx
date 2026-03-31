import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withSpring
} from 'react-native-reanimated';
import { useTheme } from '@contexts/ThemeContext';
import { useFeedback } from '@contexts/FeedbackContext';
import { DSText } from '@ds/Text';
import { useVote } from '@hooks/useVote';
import { VoteType } from '@appTypes/index';

interface VoteButtonsProps {
    postId: string;
    upvotes: number;
    downvotes: number;
    iconSize?: number;
}

export function VoteButtons({ postId, upvotes, downvotes, iconSize = 18 }: VoteButtonsProps) {
    const { tokens, colorMode } = useTheme();
    const { currentVote, upvotes: currentUpvotes, downvotes: currentDownvotes, vote } = useVote(postId, upvotes, downvotes);

    const upScale = useSharedValue(1);
    const downScale = useSharedValue(1);

    const upStyle = useAnimatedStyle(() => ({ transform: [{ scale: upScale.value }] }));
    const downStyle = useAnimatedStyle(() => ({ transform: [{ scale: downScale.value }] }));

    const { playSuccess, playClick } = useFeedback();

    async function handleVote(type: VoteType) {
        const scale = type === 'up' ? upScale : downScale;
        scale.value = withSequence(
            withSpring(1.1, { damping: 15, stiffness: 200 }),
            withSpring(1, { damping: 15, stiffness: 200 })
        );

        if (type !== currentVote && type !== null) {
            playSuccess();
        } else {
            playClick();
        }
        vote(type);
    }

    const upActive = currentVote === 'up';
    const downActive = currentVote === 'down';

    return (
        <View style={styles.row}>
            <TouchableOpacity onPress={() => handleVote('up')} activeOpacity={0.7}>
                <Animated.View
                    style={[
                        styles.pill,
                        { backgroundColor: upActive ? tokens.colors.accent : (colorMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') },
                        upStyle
                    ]}
                >
                    <Ionicons
                        name={upActive ? "arrow-up-circle" : "arrow-up-outline"}
                        size={iconSize}
                        color={upActive ? "white" : tokens.colors.textMuted}
                    />
                    <DSText
                        size="sm"
                        weight="bold"
                        style={{ color: upActive ? "white" : tokens.colors.textMuted }}
                    >
                        {String(currentUpvotes)}
                    </DSText>
                </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleVote('down')} activeOpacity={0.7}>
                <Animated.View
                    style={[
                        styles.pill,
                        { backgroundColor: downActive ? tokens.colors.accent : (colorMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') },
                        downStyle
                    ]}
                >
                    <Ionicons
                        name={downActive ? "arrow-down-circle" : "arrow-down-outline"}
                        size={iconSize}
                        color={downActive ? "white" : tokens.colors.textMuted}
                    />
                    <DSText
                        size="sm"
                        weight="bold"
                        style={{ color: downActive ? "white" : tokens.colors.textMuted }}
                    >
                        {String(currentDownvotes)}
                    </DSText>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 18,
        paddingVertical: 6,
        borderRadius: 20,
    },
});
