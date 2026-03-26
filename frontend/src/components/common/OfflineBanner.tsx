import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';

export function OfflineBanner() {
    const { tokens } = useTheme();
    const bannerStyle = {
        backgroundColor: tokens.colors.surface2,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
        paddingHorizontal: tokens.spacing.lg,
        paddingVertical: tokens.spacing.sm,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: tokens.spacing.sm,
    };
    return (
        <View style={bannerStyle}>
            <Ionicons name="cloud-offline-outline" size={16} color={tokens.colors.danger} />
            <DSText size="sm" color="textMuted">No internet connection</DSText>
        </View>
    );
}

