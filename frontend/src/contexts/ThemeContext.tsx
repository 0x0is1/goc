import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTokens, darkTokens, ThemeTokens } from '@ds/tokens';
import { ColorMode } from '@appTypes/index';

interface ThemeContextValue {
    tokens: ThemeTokens;
    colorMode: ColorMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'color_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [colorMode, setColorMode] = useState<ColorMode>('dark');

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
            if (stored === 'light' || stored === 'dark') {
                setColorMode(stored);
            }
        });
    }, []);

    function toggleTheme() {
        const next: ColorMode = colorMode === 'dark' ? 'light' : 'dark';
        setColorMode(next);
        AsyncStorage.setItem(STORAGE_KEY, next);
    }

    const tokens = colorMode === 'dark' ? darkTokens : lightTokens;

    return (
        <ThemeContext.Provider value={{ tokens, colorMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}

