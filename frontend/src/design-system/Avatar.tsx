import React from 'react';
import { View, Image, ViewStyle, ImageStyle, StyleSheet } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';

interface DSAvatarProps {
    size: number;
    uri?: string;
    name?: string;
}

export function DSAvatar({ size, uri, name }: DSAvatarProps) {
    const { tokens } = useTheme();
    const containerStyle: ViewStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tokens.colors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    };
    const imageStyle: ImageStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
    };

    if (uri) {
        return <Image source={{ uri }} style={imageStyle} />;
    }

    const initials = name ? name.slice(0, 2).toUpperCase() : '??';
    return (
        <View style={containerStyle}>
            <DSText size="xs" weight="bold" color="textMuted">{initials}</DSText>
        </View>
    );
}

export default DSAvatar;

