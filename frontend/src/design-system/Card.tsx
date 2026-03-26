import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';

interface DSCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export function DSCard({ children, style }: DSCardProps) {
    const { tokens } = useTheme();
    const cardStyle: ViewStyle = {
        backgroundColor: tokens.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
        paddingHorizontal: tokens.spacing.lg,
        paddingVertical: tokens.spacing.md,
    };
    return <View style={[cardStyle, style]}>{children}</View>;
}

export default DSCard;

