import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';

interface DSIconButtonProps {
    onPress: () => void;
    icon: React.ReactNode;
    size?: number;
    accessibilityLabel: string;
    style?: ViewStyle;
}

export function DSIconButton({ onPress, icon, size = 36, accessibilityLabel, style }: DSIconButtonProps) {
    const { tokens } = useTheme();
    const btnStyle: ViewStyle = {
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
    };
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[btnStyle, style]}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
        >
            {icon}
        </TouchableOpacity>
    );
}

export default DSIconButton;

