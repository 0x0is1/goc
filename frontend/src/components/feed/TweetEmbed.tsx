import React from 'react';
import { View, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { useTheme } from '@contexts/ThemeContext';

interface TweetEmbedProps {
    html: string;
    height: number;
}

export function TweetEmbed({ html, height }: TweetEmbedProps) {
    const { tokens } = useTheme();

    const fullHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:8px;background:${tokens.colors.surface2};font-family:sans-serif;}</style></head><body>${html}<script async src="https://platform.twitter.com/widgets.js"></script></body></html>`;

    function onShouldStartLoadWithRequest(req: { url: string }): boolean {
        const url = req.url;
        if (url === 'about:blank') return true;
        if (url.includes('twitter.com') || url.includes('x.com')) return true;
        return false;
    }

    return (
        <View style={{ height, backgroundColor: tokens.colors.surface2 }}>
            <WebView
                source={{ html: fullHtml }}
                style={{ backgroundColor: 'transparent', flex: 1 }}
                scrollEnabled={false}
                onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                javaScriptEnabled
                domStorageEnabled={false}
            />
        </View>
    );
}

