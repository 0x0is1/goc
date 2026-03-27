import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
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
    leftIcon?: React.ReactNode;
    accessibilityLabel?: string;
}

export function DSButton({
    onPress,
    label,
    variant = 'solid',
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon,
    accessibilityLabel,
}: DSButtonProps) {
    const { tokens } = useTheme();
    const scale = useSharedValue(1);

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

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const textColor =
        variant === 'solid' ? 'accentForeground'
            : variant === 'ghost' ? 'danger'
                : 'textPrimary';

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            onPressIn={() => (scale.value = withSpring(0.96))}
            onPressOut={() => (scale.value = withSpring(1))}
            style={containerStyle}
            disabled={disabled || loading}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityRole="button"
        >
            <Animated.View style={[styles.inner, animatedStyle]}>
                {loading ? (
                    <ActivityIndicator color={variant === 'solid' ? tokens.colors.accentForeground : tokens.colors.textPrimary} />
                ) : (
                    <>
                        {leftIcon && <View style={{ marginRight: 0 }}>{leftIcon}</View>}
                        <DSText weight="semiBold" size="base" color={textColor}>{label}</DSText>
                    </>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
});

export default DSButton;

