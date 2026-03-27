import React from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from './Text';

interface DSBadgeProps {
    label: string;
    variant?: 'solid' | 'outline';
    color?: string;
    onPress?: () => void;
    style?: ViewStyle;
}

const PRESET_COLORS = [
    '#E91E63', // Politics/Pink
    '#2196F3', // Tech/Blue
    '#4CAF50', // Economy/Green
    '#9C27B0', // Social/Purple
    '#FF9800', // Warning/Orange
    '#00BCD4', // Info/Cyan
    '#673AB7', // Law/Deep Purple
    '#795548', // History/Brown
];

function getDeterministicColor(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PRESET_COLORS.length;
    return PRESET_COLORS[index];
}

export function DSBadge({ label, variant = 'solid', color, onPress, style }: DSBadgeProps) {
    const { tokens } = useTheme();

    // Use provided color, or map semantic names, or generate deterministic color
    const bgColor = color
        ? (tokens.colors[color as keyof typeof tokens.colors] || color)
        : getDeterministicColor(label.toLowerCase());

    const containerStyle: ViewStyle = {
        borderWidth: 1,
        borderColor: variant === 'outline' ? bgColor : 'transparent',
        backgroundColor: variant === 'solid' ? bgColor : 'transparent',
        paddingHorizontal: tokens.spacing.sm,
        paddingVertical: 2,
        borderRadius: tokens.radius.sm,
        alignSelf: 'flex-start',
    };

    const content = (
        <View style={[containerStyle, style]}>
            <DSText
                size="xs"
                weight="bold"
                style={{ color: variant === 'solid' ? '#ffffff' : bgColor }}
            >
                {label.toUpperCase()}
            </DSText>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

export default DSBadge;

