import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';

type ButtonVariant = 'solid' | 'outline' | 'ghost';

interface DSButtonProps {
    onPress: () => void;
    label: string;
    variant?: ButtonVariant;
    fullWidth?: boolean;
    loading?: boolean;
    disabled?: boolean;
    accessibilityLabel?: string;
}

export function DSButton({
    onPress,
    label,
    variant = 'solid',
    fullWidth = false,
    loading = false,
    disabled = false,
    accessibilityLabel,
}: DSButtonProps) {
    const { tokens } = useTheme();

    const containerStyle: ViewStyle = {
        backgroundColor:
            variant === 'solid' ? tokens.colors.accent
                : 'transparent',
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor: variant === 'outline' ? tokens.colors.border : 'transparent',
        paddingHorizontal: tokens.spacing.lg,
        paddingVertical: tokens.spacing.md,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderRadius: tokens.radius.sm,
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.5 : 1,
    };

    const textColor =
        variant === 'solid' ? 'accentForeground'
            : variant === 'ghost' ? 'danger'
                : 'textPrimary';

    return (
        <TouchableOpacity
            onPress={onPress}
            style={containerStyle}
            disabled={disabled || loading}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityRole="button"
        >
            {loading ? (
                <ActivityIndicator color={variant === 'solid' ? tokens.colors.accentForeground : tokens.colors.textPrimary} />
            ) : (
                <DSText weight="semiBold" size="base" color={textColor}>{label}</DSText>
            )}
        </TouchableOpacity>
    );
}

export default DSButton;

