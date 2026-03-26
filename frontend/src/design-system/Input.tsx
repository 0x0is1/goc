import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';

interface DSInputProps extends TextInputProps {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: ViewStyle;
}

export function DSInput({ leftIcon, rightIcon, style, ...props }: DSInputProps) {
    const { tokens } = useTheme();
    const [focused, setFocused] = useState(false);

    const containerStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: focused ? tokens.colors.accent : tokens.colors.border,
        backgroundColor: tokens.colors.surface,
        paddingHorizontal: tokens.spacing.md,
        height: 48,
        borderRadius: tokens.radius.sm,
    };

    const inputStyle: TextStyle = {
        flex: 1,
        color: tokens.colors.textPrimary,
        fontSize: tokens.fontSize.base,
        fontFamily: 'PlusJakartaSans_400Regular',
        paddingVertical: 0,
    };

    return (
        <View style={[containerStyle, style]}>
            {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
            <TextInput
                style={inputStyle}
                placeholderTextColor={tokens.colors.textMuted}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...props}
            />
            {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    icon: {
        marginHorizontal: 4,
    },
});

export default DSInput;

