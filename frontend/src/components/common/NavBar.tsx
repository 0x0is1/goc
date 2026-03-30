import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { Image } from 'expo-image';
import { useFeedback } from '@contexts/FeedbackContext';

interface NavBarProps {
    title?: string;
    showBack?: boolean;
    rightElement?: React.ReactNode;
    showInfo?: boolean;
}

export function NavBar({ title, showBack, rightElement, showInfo }: NavBarProps) {
    const { tokens } = useTheme();
    const insets = useSafeAreaInsets();
    const { playTick } = useFeedback();

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: tokens.colors.surface,
                borderBottomColor: tokens.colors.border,
                paddingTop: insets.top,
                height: tokens.layout.headerHeight + insets.top,
            }
        ]}>
            <View style={styles.content}>
                <View style={styles.left}>
                    {showBack ? (
                        <TouchableOpacity
                            onPress={() => {
                                playTick();
                                router.back();
                            }}
                            style={styles.iconBtn}
                            accessibilityLabel="Go back"
                        >
                            <Ionicons name="arrow-back" size={24} color={tokens.colors.textPrimary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.brandRow}>
                            <Image source={require('../../../assets/splash-icon.png')} style={styles.icon} contentFit='contain' />
                        </View>
                    )}
                </View>

                <View style={styles.center}>
                    <DSText
                        size={title ? "md" : "lg"}
                        weight="extraBold"
                        color="textPrimary"
                        style={styles.titleText}
                    >
                        {title || "Black Hands"}
                    </DSText>
                </View>

                <View style={styles.right}>
                    {rightElement ? rightElement : (showInfo && (
                        <TouchableOpacity
                            onPress={() => {
                                playTick();
                                router.push('/info');
                            }}
                            style={styles.iconBtn}
                            accessibilityLabel="View Information"
                        >
                            <Ionicons name="information-circle-outline" size={24} color={tokens.colors.textPrimary} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderBottomWidth: 1,
        justifyContent: 'flex-end',
    },
    content: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    left: {
        width: 40,
        justifyContent: 'center',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    right: {
        width: 40,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleText: {
        letterSpacing: -0.5,
    },
    iconBtn: {
        padding: 4,
        marginLeft: -4,
    },
    icon: {
        width: 32,
        height: 32,
    }
});
