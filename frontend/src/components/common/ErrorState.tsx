import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { DSButton } from '@ds/Button';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
    const { tokens } = useTheme();
    return (
        <View style={styles.container}>
            <Ionicons name="alert-circle-outline" size={64} color={tokens.colors.danger} />
            <DSText size="xl" weight="extraBold" color="textPrimary">Error</DSText>
            <DSText size="base" color="textMuted">{message}</DSText>
            {onRetry && <DSButton label="Retry" onPress={onRetry} variant="outline" />}
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

