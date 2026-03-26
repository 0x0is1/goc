import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';

interface EmptyStateProps {
    message?: string;
}

export function EmptyState({ message = 'No gems found yet.' }: EmptyStateProps) {
    const { tokens } = useTheme();
    return (
        <View style={styles.container}>
            <Ionicons name="search-outline" size={64} color={tokens.colors.textMuted} />
            <DSText size="xl" weight="extraBold" color="textPrimary">Nothing Here Yet</DSText>
            <DSText size="base" color="textMuted">{message}</DSText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
        gap: 12,
    },
});

