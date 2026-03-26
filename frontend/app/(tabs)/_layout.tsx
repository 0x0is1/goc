import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@contexts/ThemeContext';
import { TAB_BAR_HEIGHT } from '@utils/constants';

export default function TabsLayout() {
    const { tokens } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: tokens.colors.tabBar,
                    borderTopWidth: 1,
                    borderTopColor: tokens.colors.tabBarBorder,
                    elevation: 0,
                    shadowOpacity: 0,
                    height: TAB_BAR_HEIGHT + insets.bottom,
                    paddingBottom: insets.bottom,
                },
                tabBarActiveTintColor: tokens.colors.accent,
                tabBarInactiveTintColor: tokens.colors.textMuted,
                tabBarLabelStyle: {
                    fontFamily: 'PlusJakartaSans_500Medium',
                    fontSize: tokens.fontSize.sm,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

