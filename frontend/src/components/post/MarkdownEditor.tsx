import React from 'react';
import { View, TextInput, StyleSheet, TextStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@contexts/ThemeContext';

interface MarkdownEditorProps {
    value: string;
    onChange: (val: string) => void;
    previewMode: boolean;
    minHeight?: number;
    placeholder?: string;
}

export function MarkdownEditor({ value, onChange, previewMode, minHeight = 120, placeholder = 'Write a detailed description...' }: MarkdownEditorProps) {
    const { tokens } = useTheme();

    const inputStyle: TextStyle = {
        color: tokens.colors.textPrimary,
        fontSize: tokens.fontSize.base,
        fontFamily: 'PlusJakartaSans_400Regular',
        minHeight,
        textAlignVertical: 'top',
        paddingTop: 0,
    };

    const markdownStyles = {
        body: {
            color: tokens.colors.textPrimary,
            fontSize: tokens.fontSize.base,
            fontFamily: 'PlusJakartaSans_400Regular',
        },
    };

    if (previewMode) {
        return (
            <View style={{ minHeight }}>
                <Markdown style={markdownStyles}>{value || '*Nothing to preview yet...*'}</Markdown>
            </View>
        );
    }

    return (
        <TextInput
            style={inputStyle}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={tokens.colors.textMuted}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Description editor"
        />
    );
}

