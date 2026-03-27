import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFeed } from '@services/api';
import { Post } from '@appTypes/index';

export const BACKGROUND_POST_CHECK_TASK = 'BACKGROUND_POST_CHECK_TASK';
const LAST_POST_ID_KEY = 'last_seen_post_id';

// Define the background task
TaskManager.defineTask(BACKGROUND_POST_CHECK_TASK, async () => {
    try {
        console.log('[BackgroundFetch] Running background post check...');

        // 1. Fetch latest posts
        const { posts } = await getFeed();
        if (!posts || posts.length === 0) {
            console.log('[BackgroundFetch] No posts fetched.');
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // 2. Get last seen ID
        const lastSeenId = await AsyncStorage.getItem(LAST_POST_ID_KEY);
        const latestId = posts[0].id;

        if (latestId !== lastSeenId) {
            // 3. Count how many are new
            let newCount = 0;
            if (!lastSeenId) {
                newCount = posts.length;
            } else {
                newCount = posts.findIndex((p: Post) => p.id === lastSeenId);
                if (newCount === -1) newCount = posts.length; // All fetched are new
            }

            if (newCount > 0) {
                console.log(`[BackgroundFetch] Found ${newCount} new gems!`);

                // 4. Send notification
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: '💎 New Controversy Gems',
                        body: `${newCount} new controversy ${newCount === 1 ? 'gem has' : 'gems have'} been curated. Check them out!`,
                        data: { url: '/(tabs)/' },
                    },
                    trigger: null, // Send immediately
                });

                // 5. Update last seen ID
                await AsyncStorage.setItem(LAST_POST_ID_KEY, latestId);
                return BackgroundFetch.BackgroundFetchResult.NewData;
            }
        }

        console.log('[BackgroundFetch] No new gems found.');
        return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
        console.error('[BackgroundFetch] Task failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

/**
 * Register the background fetch task.
 * Recommended call site: Root _layout.tsx inside a useEffect.
 */
export async function registerBackgroundFetchAsync() {
    console.log('[BackgroundFetch] Registering production task...');
    return BackgroundFetch.registerTaskAsync(BACKGROUND_POST_CHECK_TASK, {
        minimumInterval: 60 * 120, // 2 hours in seconds
        stopOnTerminate: false,    // keep running after app is closed
        startOnBoot: true,         // restart after device reboot
    });
}

/**
 * Unregister the task (for testing or opt-out).
 */
export async function unregisterBackgroundFetchAsync() {
    return BackgroundFetch.unregisterTaskAsync(BACKGROUND_POST_CHECK_TASK);
}

export async function isTaskRegisteredAsync() {
    return TaskManager.isTaskRegisteredAsync(BACKGROUND_POST_CHECK_TASK);
}
