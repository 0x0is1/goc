import React, { useState } from 'react';
import { TouchableOpacity, Image, StyleSheet, Modal, View, Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { WAYBACK_LOGO_SIZE } from '@utils/constants';
import { useFeedback } from '@contexts/FeedbackContext';

interface WaybackButtonProps {
    waybackUrl?: string;
    snapshotScreenshot?: string;
}

export function WaybackButton({ waybackUrl, snapshotScreenshot }: WaybackButtonProps) {
    const { tokens } = useTheme();
    const [visible, setVisible] = useState(false);
    const { playClick, playTick } = useFeedback();

    async function handlePress() {
        console.log('[WaybackButton] Press. snapshot:', !!snapshotScreenshot, 'url:', !!waybackUrl);
        playClick();
        if (snapshotScreenshot) {
            setVisible(true);
        } else if (waybackUrl) {
            await WebBrowser.openBrowserAsync(waybackUrl);
        }
    }

    const hasArchive = !!(snapshotScreenshot || waybackUrl);

    return (
        <>
            <TouchableOpacity
                onPress={handlePress}
                disabled={!hasArchive}
                accessibilityLabel={hasArchive ? "View tweet archive" : "No archive available"}
                accessibilityRole="button"
                style={[
                    styles.pill,
                    { backgroundColor: tokens.colors.surface2 },
                    !hasArchive && { opacity: 0.3 }
                ]}
            >
                <Ionicons
                    name="camera-outline"
                    size={16}
                    color={tokens.colors.textMuted}
                />
                <DSText size="sm" weight="bold" color="textMuted">Archive</DSText>
            </TouchableOpacity>

            {snapshotScreenshot && (
                <Modal
                    visible={visible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Pressable
                            style={styles.closeBtn}
                            onPress={() => {
                                playTick();
                                setVisible(false);
                            }}
                        >
                            <Ionicons name="close-circle" size={40} color="white" />
                        </Pressable>
                        <Image
                            source={{ uri: snapshotScreenshot }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    </View>
                </Modal>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    logo: {
        height: 16,
        width: 16,
    },
    modalContent: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '90%',
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
});

