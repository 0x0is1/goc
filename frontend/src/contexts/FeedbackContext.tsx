import React, { createContext, useContext, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

interface FeedbackContextValue {
    playClick: () => void;
    playTick: () => void;
    playSuccess: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const SOUND_ASSETS = {
    click: require('../../assets/sounds/click.mp3'),
    tick: require('../../assets/sounds/tick.mp3'),
    success: require('../../assets/sounds/success.mp3'),
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const sounds = useRef<{ [key: string]: Audio.Sound }>({});

    useEffect(() => {
        const loadSounds = async () => {
            try {
                const loaded: { [key: string]: Audio.Sound } = {};
                for (const [key, asset] of Object.entries(SOUND_ASSETS)) {
                    const { sound } = await Audio.Sound.createAsync(asset, { volume: 0.15 });
                    loaded[key] = sound;
                }
                sounds.current = loaded;
            } catch (err) {
                console.log('Failed to load local feedback sounds:', err);
            }
        };
        loadSounds();

        return () => {
            Object.values(sounds.current).forEach(s => s.unloadAsync());
        };
    }, []);

    const playClick = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (sounds.current.click) {
            try { await sounds.current.click.replayAsync(); } catch (e) { }
        }
    };

    const playTick = async () => {
        Haptics.selectionAsync();
        if (sounds.current.tick) {
            try { await sounds.current.tick.replayAsync(); } catch (e) { }
        }
    };

    const playSuccess = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (sounds.current.success) {
            try { await sounds.current.success.replayAsync(); } catch (e) { }
        }
    };

    return (
        <FeedbackContext.Provider value={{ playClick, playTick, playSuccess }}>
            {children}
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const ctx = useContext(FeedbackContext);
    if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider');
    return ctx;
}
