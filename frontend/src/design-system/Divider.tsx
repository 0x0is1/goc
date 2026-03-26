import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';

interface DSDividerProps {
    style?: ViewStyle;
}

export function DSDivider({ style }: DSDividerProps) {
    const { tokens } = useTheme();
    const dividerStyle: ViewStyle = {
        height: 1,
        backgroundColor: tokens.colors.border,
    };
    return <View style={[dividerStyle, style]} />;
}

export default DSDivider;

