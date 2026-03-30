import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@contexts/ThemeContext';

interface MarkdownBodyProps {
    /** The raw markdown string to render */
    children: string;
    /** Limit rendered content to approx N lines by truncating input (preview mode). */
    maxLines?: number;
    /** Extra style to apply to the outer wrapper */
    compact?: boolean;
    /** Container view style */
    containerStyle?: any;
}

/**
 * Shared themed markdown renderer.
 * Use `maxLines` for card previews (truncates the source before rendering).
 * Omit `maxLines` for full-page detail views.
 */
export const MarkdownBody = memo(({ children, maxLines, compact, containerStyle }: MarkdownBodyProps) => {
    const { tokens, colorMode } = useTheme();

    // Truncate by newlines for preview — crude but avoids clipping mid-element
    let content = children ?? '';
    if (maxLines) {
        const lines = content.split('\n');
        if (lines.length > maxLines) {
            content = lines.slice(0, maxLines).join('\n') + '…';
        }
    }

    const accent = tokens.colors.accent;
    const muted = tokens.colors.textMuted;
    const primary = tokens.colors.textPrimary;
    const surface2 = tokens.colors.surface2;
    const border = tokens.colors.border;

    const mdStyles = StyleSheet.create({
        // --- block elements ---
        body: {
            color: muted,
            fontSize: compact ? 13 : 15,
            lineHeight: compact ? 20 : 24,
            fontFamily: 'Inter-Regular',
        },
        paragraph: {
            marginTop: 0,
            marginBottom: compact ? 4 : 10,
            color: muted,
        },
        heading1: {
            color: primary,
            fontSize: compact ? 15 : 20,
            fontFamily: 'Inter-Bold',
            marginBottom: compact ? 4 : 10,
        },
        heading2: {
            color: primary,
            fontSize: compact ? 14 : 18,
            fontFamily: 'Inter-SemiBold',
            marginBottom: compact ? 3 : 8,
        },
        heading3: {
            color: primary,
            fontSize: compact ? 13 : 16,
            fontFamily: 'Inter-SemiBold',
            marginBottom: compact ? 2 : 6,
        },
        // --- inline ---
        strong: {
            color: primary,
            fontFamily: 'Inter-Bold',
        },
        em: {
            fontStyle: 'italic',
            color: muted,
        },
        s: {
            textDecorationLine: 'line-through',
        },
        link: {
            color: accent,
            textDecorationLine: 'none',
        },
        // --- blockquote ---
        blockquote: {
            backgroundColor: surface2,
            borderLeftWidth: 3,
            borderLeftColor: accent,
            paddingLeft: 12,
            paddingVertical: 6,
            borderRadius: 4,
            marginVertical: 8,
        },
        // --- code ---
        code_inline: {
            backgroundColor: surface2,
            color: accent,
            fontFamily: 'Inter-Regular',
            fontSize: compact ? 11 : 13,
            borderRadius: 4,
            paddingHorizontal: 4,
        },
        fence: {
            backgroundColor: surface2,
            borderWidth: 1,
            borderColor: border,
            borderRadius: 8,
            padding: 12,
            marginVertical: 8,
        },
        code_block: {
            backgroundColor: surface2,
            borderWidth: 1,
            borderColor: border,
            borderRadius: 8,
            padding: 12,
            fontFamily: 'Inter-Regular',
            fontSize: 12,
            color: primary,
        },
        // --- lists ---
        bullet_list: {
            marginBottom: 8,
        },
        ordered_list: {
            marginBottom: 8,
        },
        list_item: {
            flexDirection: 'row',
            marginBottom: 4,
        },
        bullet_list_icon: {
            color: accent,
            marginRight: 6,
            fontWeight: 'bold',
        },
        ordered_list_icon: {
            color: accent,
            marginRight: 6,
            fontWeight: 'bold',
        },
        // --- hr ---
        hr: {
            backgroundColor: border,
            height: 1,
            marginVertical: 12,
        },
    });

    return (
        <View style={containerStyle}>
            <Markdown style={mdStyles as any}>
                {content}
            </Markdown>
        </View>
    );
});

MarkdownBody.displayName = 'MarkdownBody';
