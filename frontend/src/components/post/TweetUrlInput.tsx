import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { tweetUrlSchema } from '@utils/validators';

interface TweetUrlInputProps {
    value: string;
    onChange: (val: string) => void;
    error?: string;
}

export function TweetUrlInput({ value, onChange, error }: TweetUrlInputProps) {
    const { tokens } = useTheme();
    const [focused, setFocused] = useState(false);

    const isValid = value.length > 0 && tweetUrlSchema.safeParse(value).success;
    const isInvalid = value.length > 0 && !isValid;

    const dotColor = isValid ? tokens.colors.success : isInvalid ? tokens.colors.danger : 'transparent';

    const containerStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        borderWidth: 1,
        borderColor: focused ? tokens.colors.accent : tokens.colors.border,
        backgroundColor: tokens.colors.surface,
        paddingHorizontal: tokens.spacing.md,
        height: 48,
    };

    const inputStyle: TextStyle = {
        flex: 1,
        color: tokens.colors.textPrimary,
        fontSize: tokens.fontSize.base,
        fontFamily: 'PlusJakartaSans_400Regular',
        paddingVertical: 0,
    };

    const dotStyle = {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: dotColor,
    };

    return (
        <View>
            <View style={containerStyle}>
                <Ionicons name="logo-twitter" size={18} color={tokens.colors.textMuted} style={styles.leftIcon} />
                <TextInput
                    style={inputStyle}
                    value={value}
                    onChangeText={onChange}
                    placeholder="https://twitter.com/..."
                    placeholderTextColor={tokens.colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    accessibilityLabel="Tweet URL"
                />
                <View style={dotStyle} />
            </View>
            {error && <DSText size="sm" color="danger" style={styles.error}>{error}</DSText>}
        </View>
    );
}

const styles = StyleSheet.create({
    leftIcon: { marginRight: 8 },
    error: { marginTop: 4 },
});

