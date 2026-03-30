import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const BACKGROUND_POST_CHECK_TASK = 'BACKGROUND_POST_CHECK_TASK';
const LAST_POST_ID_KEY = 'last_seen_post_id';

// Use unauthenticated fetch - posts feed is public, auth token refresh fails in background
const API_BASE = process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

TaskManager.defineTask(BACKGROUND_POST_CHECK_TASK, async () => {
    try {
        console.log('[BackgroundFetch] Running background post check...');

        const res = await fetch(`${API_BASE}/posts?limit=10&sort=latest`);
        if (!res.ok) return BackgroundFetch.BackgroundFetchResult.Failed;

        const json = await res.json();
        const posts: { id: string }[] = json.data || [];
        if (!posts || posts.length === 0) {
            console.log('[BackgroundFetch] No posts fetched.');
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }


        const lastSeenId = await AsyncStorage.getItem(LAST_POST_ID_KEY);
        const latestId = posts[0].id;

        if (latestId !== lastSeenId) {

            let newCount = 0;
            if (!lastSeenId) {
                newCount = posts.length;
            } else {
                newCount = posts.findIndex((p) => p.id === lastSeenId);
                if (newCount === -1) newCount = posts.length;
            }

            if (newCount > 0) {
                console.log(`[BackgroundFetch] Found ${newCount} new posts!`);


                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'New Controversy Posts',
                        body: `${newCount} new controversy ${newCount === 1 ? 'post has' : 'posts have'} been curated. Check them out!`,
                        data: { url: '/(tabs)/' },
                    },
                    trigger: null,
                });


                await AsyncStorage.setItem(LAST_POST_ID_KEY, latestId);
                return BackgroundFetch.BackgroundFetchResult.NewData;
            }
        }

        console.log('[BackgroundFetch] No new posts found.');
        return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
        console.error('[BackgroundFetch] Task failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});


export async function registerBackgroundFetchAsync() {
    console.log('[BackgroundFetch] Registering production task...');
    return BackgroundFetch.registerTaskAsync(BACKGROUND_POST_CHECK_TASK, {
        minimumInterval: 60 * 60 * 2,
        stopOnTerminate: false,
        startOnBoot: true,
    });
}


export async function unregisterBackgroundFetchAsync() {
    return BackgroundFetch.unregisterTaskAsync(BACKGROUND_POST_CHECK_TASK);
}

export async function isTaskRegisteredAsync() {
    return TaskManager.isTaskRegisteredAsync(BACKGROUND_POST_CHECK_TASK);
}
