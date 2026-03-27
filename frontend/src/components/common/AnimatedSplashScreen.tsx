import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    runOnJS,
    Easing,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';

const { width } = Dimensions.get('window');

interface Props {
    onAnimationComplete: () => void;
}

export const AnimatedSplashScreen: React.FC<Props> = ({ onAnimationComplete }) => {
    const { tokens } = useTheme();

    const logoOpacity = useSharedValue(0);
    const logoScale = useSharedValue(0.8);
    const contentOpacity = useSharedValue(0);
    const loaderWidth = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        // Animation Sequence
        // 1. Logo fades in and scales slightly
        logoOpacity.value = withTiming(1, { duration: 800 });
        logoScale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });

        // 2. Text elements fade in
        contentOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));

        // 3. Loader animates
        loaderWidth.value = withDelay(600, withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }));

        // 4. Exit
        containerOpacity.value = withDelay(
            2800,
            withTiming(0, { duration: 600 }, (finished) => {
                if (finished) {
                    runOnJS(onAnimationComplete)();
                }
            })
        );
    }, []);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [20, 0]) }]
    }));

    const loaderAnimatedStyle = useAnimatedStyle(() => ({
        width: `${loaderWidth.value * 100}%`
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    return (
        <Animated.View style={[
            styles.container,
            { backgroundColor: tokens.colors.background },
            containerStyle
        ]}>
            <View style={styles.centerContent}>
                <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
                    <Image
                        source={require('../../../assets/icon.png')}
                        style={styles.logo}
                        resizeMode="cover"
                    />
                </Animated.View>

                <Animated.View style={[styles.branding, contentAnimatedStyle]}>
                    <DSText size="2xl" weight="bold" color="textPrimary" style={styles.title}>
                        GoC
                    </DSText>
                    <DSText size="sm" weight="medium" color="textMuted" style={styles.subtitle}>
                        Exposing Deceptive Scams of INC
                    </DSText>
                </Animated.View>

                <View style={styles.loaderContainer}>
                    <Animated.View
                        style={[
                            styles.loaderBar,
                            { backgroundColor: tokens.colors.accent },
                            loaderAnimatedStyle
                        ]}
                    />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    centerContent: {
        alignItems: 'center',
        width: '100%',
    },
    logoWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    branding: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        letterSpacing: 4,
        marginBottom: 4,
    },
    subtitle: {
        letterSpacing: 1,
        opacity: 0.8,
    },
    loaderContainer: {
        width: width * 0.6,
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loaderBar: {
        height: '100%',
        borderRadius: 2,
    },
});
