import axios from 'axios';
import logger from '@utils/logger';

const WAYBACK_SAVE_URL = 'https://web.archive.org/save/';
const WAYBACK_PATTERN = /^https:\/\/web\.archive\.org\/web\/\d+\*?\//;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const TIMEOUT_MS = 30000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WaybackService {
    static async createSnapshot(url: string): Promise<string | null> {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await axios.post(
                    `${WAYBACK_SAVE_URL}${encodeURIComponent(url)}`,
                    null,
                    {
                        maxRedirects: 5,
                        timeout: TIMEOUT_MS,
                        validateStatus: (status) => status < 500,
                    }
                );

                if (response.status >= 400) {
                    logger.warn('Wayback API client error — not retrying', { status: response.status, url });
                    return null;
                }

                const locationHeader = response.headers['location'] as string | undefined;
                if (locationHeader && WAYBACK_PATTERN.test(locationHeader)) {
                    return locationHeader;
                }

                const body = typeof response.data === 'string' ? response.data : '';
                const match = body.match(/https:\/\/web\.archive\.org\/web\/\d+\*?\//);
                if (match) {
                    const snapshotUrl = match[0];
                    if (WAYBACK_PATTERN.test(snapshotUrl)) return snapshotUrl;
                }

                logger.warn('Wayback: snapshot URL not found in response', { attempt, url });
                if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
            } catch (err) {
                const isNetworkError = axios.isAxiosError(err) && !err.response;
                logger.warn('Wayback: request failed', { attempt, url, isNetworkError });
                if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
            }
        }
        return null;
    }
}
