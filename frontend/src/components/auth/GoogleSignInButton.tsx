import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';

interface GoogleSignInButtonProps {
    onPress: () => void;
    loading?: boolean;
}

export function GoogleSignInButton({ onPress, loading = false }: GoogleSignInButtonProps) {
    const { tokens } = useTheme();

    const btnStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: tokens.spacing.sm,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        backgroundColor: tokens.colors.surface,
        paddingVertical: tokens.spacing.md,
        paddingHorizontal: tokens.spacing.lg,
        borderRadius: tokens.radius.sm,
        opacity: loading ? 0.6 : 1,
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            style={btnStyle}
            disabled={loading}
            accessibilityLabel="Sign in with Google"
            accessibilityRole="button"
        >
            <Ionicons name="logo-google" size={20} color={tokens.colors.textPrimary} />
            <DSText size="base" weight="medium" color="textPrimary">Continue with Google</DSText>
        </TouchableOpacity>
    );
}

