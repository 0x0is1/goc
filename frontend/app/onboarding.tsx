import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFeedback } from '@contexts/FeedbackContext';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
    {
        id: '1',
        title: 'OUR MISSION',
        subtitle: 'The Core Purpose',
        description: 'Black Hands documents the shifts in modern India. We preserve truth, ensuring accountability for those who compromise our national narrative.',
        icon: 'shield-checkmark',
        color: '#6366f1',
    },
    {
        id: '2',
        title: 'THE ARCHIVES',
        subtitle: 'Archives & Snakes',
        description: 'The Archives house social documentation. "Snakes in the Ganges" identifies those who prioritize personal gain over national integrity.',
        icon: 'skull',
        color: '#ef4444',
    }
];

export default function OnboardingScreen() {
    const { tokens, colorMode } = useTheme();
    const { playSuccess, playTick } = useFeedback();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = async () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            playTick();
            setCurrentIndex(prev => prev + 1);
        } else {
            playSuccess();
            await AsyncStorage.setItem('has_seen_onboarding', 'true');
            router.replace('/(tabs)');
        }
    };

    const currentItem = ONBOARDING_DATA[currentIndex];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
            <View style={styles.header}>
                <DSText size="xs" weight="bold" color="textMuted">
                    {currentIndex + 1} / {ONBOARDING_DATA.length}
                </DSText>
                <TouchableOpacity onPress={async () => {
                    playTick();
                    await AsyncStorage.setItem('has_seen_onboarding', 'true');
                    router.replace('/(tabs)');
                }}>
                    <DSText size="sm" weight="bold" color="accent" style={{ letterSpacing: 2, padding: 8, paddingHorizontal: 16, backgroundColor: tokens.colors.accent + '25', borderRadius: 50 }}>SKIP</DSText>
                </TouchableOpacity>
            </View>

            <View style={styles.contentWrapper}>
                <Animated.View
                    key={currentItem.id}
                    entering={FadeInRight.duration(500)}
                    exiting={FadeOutLeft.duration(500)}
                    style={styles.content}
                >
                    <View style={[styles.iconHero, { backgroundColor: currentItem.color + '15' }]}>
                        <Ionicons name={currentItem.icon as any} size={100} color={currentItem.color} />
                        <View style={[styles.glow, { backgroundColor: currentItem.color }]} />
                    </View>

                    <View style={styles.textWrapper}>
                        <View style={styles.subtitleRow}>
                            <DSText size="sm" weight="extraBold" color="accent" style={{ letterSpacing: 2 }}>
                                {currentItem.subtitle.toUpperCase()}
                            </DSText>
                        </View>
                        <DSText size="3xl" weight="extraBold" color="textPrimary" style={styles.title}>
                            {currentItem.title}
                        </DSText>
                        <DSText size="lg" color="textMuted" style={styles.description}>
                            {currentItem.description}
                        </DSText>
                    </View>
                </Animated.View>
            </View>

            <View style={styles.footer}>
                <View style={styles.dotContainer}>
                    {ONBOARDING_DATA.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { backgroundColor: i === currentIndex ? tokens.colors.accent : tokens.colors.surface2 },
                                i === currentIndex && { width: 24 }
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    onPress={handleNext}
                    style={[styles.button, { backgroundColor: tokens.colors.textPrimary }]}
                >
                    <DSText
                        weight="bold"
                        color={colorMode === 'dark' ? 'background' : 'surface'}
                    >
                        {currentIndex === ONBOARDING_DATA.length - 1 ? 'GET STARTED' : 'NEXT'}
                    </DSText>
                    <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={colorMode === 'dark' ? tokens.colors.background : tokens.colors.surface}
                        style={{ marginLeft: 8 }}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
    },
    iconHero: {
        width: width * 0.7,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 40,
        marginBottom: 10,
    },
    glow: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        opacity: 0.1,
    },
    textWrapper: {
        gap: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        letterSpacing: -1.5,
        textAlign: 'center',
    },
    description: {
        lineHeight: 28,
        opacity: 0.8,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    dotContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
});
