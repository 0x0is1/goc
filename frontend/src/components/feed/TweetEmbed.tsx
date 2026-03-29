import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { useTheme } from '@contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DSText } from '@ds/Text';

interface TweetEmbedProps {
  tweetUrl?: string;
  html?: string;
  interactive?: boolean;
  onLoadStatus?: (status: 'loading' | 'loaded' | 'error') => void;
}

export function TweetEmbed({ tweetUrl, html: rawHtml, interactive = true, onLoadStatus }: TweetEmbedProps) {
  const { tokens, colorMode } = useTheme();
  const [height, setHeight] = useState(250); 
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getTweetId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  };

  const tweetId = getTweetId(tweetUrl);
  if (!tweetId) return null;

  
  useEffect(() => {
    const timer = setTimeout(() => {
      
      if (height <= 100) {
        setIsError(true);
        setIsLoading(false);
        onLoadStatus?.('error');
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [height]);

  const onWebViewMessage = (event: any) => {
    const h = parseInt(event.nativeEvent.data);
    if (!isNaN(h) && h > 10) {
      setHeight(h);
      if (h > 100) {
        setIsLoading(false);
        setIsError(false);
        onLoadStatus?.('loaded');
      }
    }
  };

  const theme = colorMode === 'light' ? 'light' : 'dark';
  const bg = tokens?.colors?.surface2 || '#000';

  if (isError) {
    return (
      <View style={{
        padding: 24,
        backgroundColor: bg,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: tokens.colors.accent + '20'
      }}>
        <Ionicons name="cloud-offline-outline" size={32} color={tokens.colors.accent} />
        <DSText size="sm" color="textPrimary" weight="bold" style={{ textAlign: 'center' }}>
          Tweet currently unavailable
        </DSText>
        <DSText size="xs" color="textMuted" style={{ textAlign: 'center', lineHeight: 18 }}>
          This content may have been deleted or the account is private.
          {"\n"}Check the original Post snapshot for context.
        </DSText>
      </View>
    );
  }

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light dark">
      <style>
        html, body {
          margin: 0;
          padding: 0;
          background: ${bg};
          overflow: hidden;
        }

        /* Target the twitter widget to remove its default margins */
        .twitter-tweet {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }

        iframe {
          border-radius: 12px !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      </style>
    </head>
    <body id="tweet-container">
      <blockquote class="twitter-tweet" data-theme="${theme}">
        <a href="https://twitter.com/i/status/${tweetId}"></a>
      </blockquote>

      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

      <script>
        function sendHeight() {
          const container = document.getElementById('tweet-container');
          const h = container ? container.offsetHeight : document.documentElement.scrollHeight;
          window.ReactNativeWebView.postMessage(h.toString());
        }

        function observe() {
          const observer = new MutationObserver(sendHeight);
          observer.observe(document.body, { childList: true, subtree: true });
        }

        function load() {
          if (window.twttr && window.twttr.widgets) {
            window.twttr.widgets.load().then(() => {
              // Periodically check height as images/content expands
              const intervals = [300, 800, 1500, 2500, 4000];
              intervals.forEach(ms => setTimeout(sendHeight, ms));
              observe();
            });
          } else {
            setTimeout(load, 300);
          }
        }

        document.addEventListener("DOMContentLoaded", load);
      </script>
    </body>
  </html>
  `;

  return (
    <View style={{ position: 'relative' }}>
      {isLoading && (
        <View style={{
          height: 150,
          backgroundColor: bg,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1
        }}>
          <Ionicons
            name="logo-twitter"
            size={24}
            color={tokens.colors.textMuted}
          />
          <DSText size="xs" color="textMuted">Loading content...</DSText>
        </View>
      )}
      <View style={{
        height,
        backgroundColor: bg,
        borderRadius: 12,
        overflow: 'hidden',
        opacity: isLoading ? 0 : 1
      }}
        pointerEvents={interactive ? 'auto' : 'none'}
      >
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          scrollEnabled={false}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          onMessage={onWebViewMessage}
        />
      </View>
    </View>
  );
}
