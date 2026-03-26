import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthContext } from '@contexts/AuthContext';
import { useToastContext } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import { FAB_SIZE, FAB_BOTTOM_OFFSET, FAB_RIGHT_OFFSET } from '@utils/constants';

export function FAB() {
    const { tokens } = useTheme();
    const { user } = useAuthContext();
    const { showToast } = useToastContext();

    async function handlePress() {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (user) {
            router.push('/create');
        } else {
            showToast('Sign in to share a Gem', 'info');
            router.push('/login');
        }
    }

    const fabStyle = {
        position: 'absolute' as const,
        right: FAB_RIGHT_OFFSET,
        bottom: FAB_BOTTOM_OFFSET,
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        backgroundColor: tokens.colors.accent,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={fabStyle}
            accessibilityLabel="Share a Gem"
            accessibilityRole="button"
        >
            <Ionicons name="add" size={28} color={tokens.colors.accentForeground} />
        </TouchableOpacity>
    );
}

