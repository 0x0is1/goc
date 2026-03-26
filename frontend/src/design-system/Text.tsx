import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';
import { ThemeTokens } from '@ds/tokens';

type FontWeight = 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
type FontSize = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type ColorKey = keyof ThemeTokens['colors'];

interface DSTextProps extends TextProps {
    size?: FontSize;
    weight?: FontWeight;
    color?: ColorKey;
}

const fontFamilyMap: Record<FontWeight, string> = {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
};

export function DSText({ size = 'base', weight = 'regular', color = 'textPrimary', style, ...props }: DSTextProps) {
    const { tokens } = useTheme();
    const textStyle: TextStyle = {
        fontSize: tokens.fontSize[size],
        fontFamily: fontFamilyMap[weight],
        color: tokens.colors[color],
    };
    return <Text style={[textStyle, style]} {...props} />;
}

export default DSText;

