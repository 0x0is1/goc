import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { WAYBACK_LOGO_SIZE } from '@utils/constants';

interface WaybackButtonProps {
    waybackUrl: string;
}

export function WaybackButton({ waybackUrl }: WaybackButtonProps) {
    async function handlePress() {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await WebBrowser.openBrowserAsync(waybackUrl);
    }

    return (
        <TouchableOpacity
            onPress={handlePress}
            accessibilityLabel="Open Wayback Machine archive"
            accessibilityRole="button"
            style={styles.btn}
        >
            <Image
                source={require('../../../assets/favicon.png')}
                style={styles.logo}
                resizeMode="contain"
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: WAYBACK_LOGO_SIZE,
        width: 60,
    },
});

