import { getMessaging } from 'firebase-admin/messaging';
import { admin } from '@config/firebase';
import logger from '@utils/logger';

export class NotificationService {
    static async sendPushNotification(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
        try {
            const message = {
                notification: {
                    title,
                    body,
                },
                data,
                token: fcmToken,
            };

            const response = await getMessaging(admin.app()).send(message);
            logger.info('Successfully sent FCM push notification', { response });
            return true;
        } catch (error) {
            logger.error('Error sending FCM push notification', { error });
            return false;
        }
    }

    static async broadcastMessage(fcmTokens: string[], title: string, body: string): Promise<void> {
        if (fcmTokens.length === 0) return;
        try {
            const message = {
                notification: { title, body },
                tokens: fcmTokens,
            };
            const response = await getMessaging(admin.app()).sendEachForMulticast(message);
            logger.info('Broadcast FCM message completed', {
                successCount: response.successCount,
                failureCount: response.failureCount
            });
        } catch (error) {
            logger.error('Error broadcasting FCM messages', { error });
        }
    }

    static async notifyNewSnake(person: any): Promise<void> {
        try {
            const { UserService } = require('./UserService');
            const tokens = await UserService.getAllFcmTokens();
            if (tokens.length === 0) return;

            const title = '🐍 New Snake Added!';
            const body = `${person.name} (${person.profession}) has been added to the archive.`;

            await NotificationService.broadcastMessage(tokens, title, body);
        } catch (error) {
            logger.error('Failed to notify new snake:', { error });
        }
    }
}
