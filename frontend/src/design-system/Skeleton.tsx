import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';

interface DSSkeletonProps {
    width?: number | string;
    height?: number;
    style?: ViewStyle;
}

export function DSSkeleton({ width = '100%', height = 16, style }: DSSkeletonProps) {
    const { tokens } = useTheme();
    const skeletonStyle: ViewStyle = {
        width: width as number,
        height,
        backgroundColor: tokens.colors.surface2,
        borderRadius: 0,
    };
    return <View style={[skeletonStyle, style]} />;
}

export function DSSkeletonCard() {
    const { tokens } = useTheme();
    const containerStyle: ViewStyle = {
        backgroundColor: tokens.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
        paddingHorizontal: tokens.spacing.lg,
        paddingVertical: tokens.spacing.md,
        gap: tokens.spacing.sm,
    };
    return (
        <View style={containerStyle}>
            <DSSkeleton height={20} width="70%" />
            <DSSkeleton height={180} />
            <DSSkeleton height={14} />
            <DSSkeleton height={14} width="80%" />
        </View>
    );
}

export default DSSkeleton;

