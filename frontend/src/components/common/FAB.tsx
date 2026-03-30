import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthContext } from '@contexts/AuthContext';
import { useToastContext } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import { FAB_SIZE, FAB_BOTTOM_OFFSET, FAB_RIGHT_OFFSET } from '@utils/constants';

interface FABProps {
    onPress?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    label?: string;
    style?: ViewStyle;
}

export function FAB({ onPress, icon = 'add', label, style }: FABProps) {
    const { tokens } = useTheme();
    const { user } = useAuthContext();
    const { showToast } = useToastContext();

    async function handleDefaultPress() {
        if (user) {
            router.push('/create');
        } else {
            showToast('Sign in to share a Post', 'info');
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
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        ...style,
    };

    return (
        <TouchableOpacity
            onPress={onPress || handleDefaultPress}
            style={fabStyle}
            accessibilityLabel={label || "Floating Action Button"}
            accessibilityRole="button"
        >
            <Ionicons name={icon} size={28} color={tokens.colors.accentForeground} />
        </TouchableOpacity>
    );
}
