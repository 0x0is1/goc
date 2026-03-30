import React from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';
import { useFeedback } from '@contexts/FeedbackContext';
import { DSText } from './Text';

interface DSBadgeProps {
    label: string;
    variant?: 'solid' | 'outline';
    color?: string;
    onPress?: () => void;
    size?: 'sm' | 'md';
    style?: ViewStyle;
    textStyle?: any;
}

const PRESET_COLORS = [
    '#E91E63',
    '#2196F3',
    '#4CAF50',
    '#9C27B0',
    '#FF9800',
    '#00BCD4',
    '#673AB7',
    '#795548',
];

function getDeterministicColor(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PRESET_COLORS.length;
    return PRESET_COLORS[index];
}

export function DSBadge({ label, variant = 'solid', color, onPress, style, size = 'md', textStyle }: DSBadgeProps) {
    const { tokens } = useTheme();


    const bgColor = color
        ? (tokens.colors[color as keyof typeof tokens.colors] || color)
        : getDeterministicColor(label.toLowerCase());

    const containerStyle: ViewStyle = {
        borderWidth: 1,
        borderColor: variant === 'outline' ? bgColor : 'transparent',
        backgroundColor: variant === 'solid' ? bgColor : 'transparent',
        paddingHorizontal: size === 'md' ? tokens.spacing.sm : tokens.spacing.md,
        paddingVertical: size === 'md' ? 1 : 2,
        borderRadius: size === 'md' ? tokens.radius.full : tokens.radius.full,
        alignSelf: 'flex-start',
    };

    const content = (
        <View style={[containerStyle, style]}>
            <DSText
                size="xs"
                weight="bold"
                style={[{ color: variant === 'solid' ? '#ffffff' : bgColor }, textStyle]}
            >
                {label.toUpperCase()}
            </DSText>
        </View>
    );

    const { playTick } = useFeedback();

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={() => {
                    playTick();
                    onPress();
                }}
                activeOpacity={0.7}
            >
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

export default DSBadge;

