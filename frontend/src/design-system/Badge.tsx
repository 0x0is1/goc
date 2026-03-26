import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';

interface DSBadgeProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export function DSBadge({ children, style }: DSBadgeProps) {
    const { tokens } = useTheme();
    const containerStyle: ViewStyle = {
        borderWidth: 1,
        borderColor: tokens.colors.border,
        paddingHorizontal: tokens.spacing.sm,
        paddingVertical: 2,
        borderRadius: tokens.radius.sm,
        alignSelf: 'flex-start',
    };
    return <View style={[containerStyle, style]}>{children}</View>;
}

export default DSBadge;

