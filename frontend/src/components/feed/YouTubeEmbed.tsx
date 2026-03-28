import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image, Linking } from 'react-native';
import WebView from 'react-native-webview';
import { useTheme } from '@contexts/ThemeContext';
import { useFeedback } from '@contexts/FeedbackContext';

interface YouTubeEmbedProps {
    url: string;
}

export function YouTubeEmbed({ url }: YouTubeEmbedProps) {
    const { tokens } = useTheme();
    const [loaded, setLoaded] = useState(false);
    const { playClick } = useFeedback();

    const getYoutubeId = (url: string) => {
        try {
            const parsed = new URL(url);

            if (parsed.hostname === 'youtu.be') {
                return parsed.pathname.slice(1);
            }

            if (parsed.searchParams.get('v')) {
                return parsed.searchParams.get('v');
            }

            if (parsed.pathname.includes('/embed/')) {
                return parsed.pathname.split('/embed/')[1];
            }

            return null;
        } catch {
            return null;
        }
    };

    const videoId = getYoutubeId(url);
    if (!videoId) return null;

    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const embedHtml = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: black;
                        height: 100%;
                        overflow: hidden;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: 0;
                    }
                </style>
            </head>
            <body>
                <iframe
                    src="https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&playsinline=1"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen
                ></iframe>
            </body>
        </html>
    `;

    return (
        <View style={[styles.container, { backgroundColor: tokens.colors.surface2 }]}>
            {!loaded ? (
                <Pressable
                    onPress={() => {
                        playClick();
                        setLoaded(true);
                    }}
                    style={styles.thumbnailWrapper}
                >
                    <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
                </Pressable>
            ) : (
                <WebView
                    source={{ html: embedHtml }}
                    style={styles.webview}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    allowsFullscreenVideo
                    userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 Chrome/120 Safari/537.36"

                    onError={() => {
                        Linking.openURL(url);
                    }}

                    originWhitelist={['*']}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 6,
    },
    thumbnailWrapper: {
        flex: 1,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    webview: {
        flex: 1,
        backgroundColor: 'black',
    },
});