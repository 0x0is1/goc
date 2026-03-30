import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CancelledPerson } from '@appTypes/index';
import { Platform } from 'react-native';

export const BACKGROUND_SNAKE_CHECK_TASK = 'BACKGROUND_SNAKE_CHECK_TASK';
const LAST_SNAKE_ID_KEY = 'last_seen_snake_id';

// Use unauthenticated fetch - snake feed is public, auth token refresh fails in background
const API_BASE = process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

TaskManager.defineTask(BACKGROUND_SNAKE_CHECK_TASK, async () => {
    try {
        console.log('[BackgroundFetch] Running background snake check...');

        const res = await fetch(`${API_BASE}/cancelled?limit=10&sort=latest`);
        if (!res.ok) return BackgroundFetch.BackgroundFetchResult.Failed;

        const json = await res.json();
        const snakes: CancelledPerson[] = json.data || [];

        if (!snakes || snakes.length === 0) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const lastSeenId = await AsyncStorage.getItem(LAST_SNAKE_ID_KEY);
        const latestId = snakes[0].id;

        if (latestId !== lastSeenId) {
            let newCount = 0;
            if (!lastSeenId) {
                newCount = snakes.length;
            } else {
                newCount = snakes.findIndex((p: CancelledPerson) => p.id === lastSeenId);
                if (newCount === -1) newCount = snakes.length;
            }

            if (newCount > 0) {
                console.log(`[BackgroundFetch] Found ${newCount} new snakes!`);

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'New Snakes in the Ganges',
                        body: `${newCount} new ${newCount === 1 ? 'person has' : 'people have'} been exposed. Check them out!`,
                        data: { url: '/(tabs)/snakes' },
                    },
                    trigger: null,
                });

                await AsyncStorage.setItem(LAST_SNAKE_ID_KEY, latestId);
                return BackgroundFetch.BackgroundFetchResult.NewData;
            }
        }

        return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
        console.error('[BackgroundFetch] Snake task failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export async function registerSnakeBackgroundFetchAsync() {
    console.log('[BackgroundFetch] Registering snake check task...');
    return BackgroundFetch.registerTaskAsync(BACKGROUND_SNAKE_CHECK_TASK, {
        minimumInterval: 60 * 60 * 2,
        stopOnTerminate: false,
        startOnBoot: true,
    });
}

export async function unregisterSnakeBackgroundFetchAsync() {
    return BackgroundFetch.unregisterTaskAsync(BACKGROUND_SNAKE_CHECK_TASK);
}
