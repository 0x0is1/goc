import puppeteer, { Browser, Page } from 'puppeteer';
import logger from '@utils/logger';

const NAVIGATION_TIMEOUT = 30000;
const SCREENSHOT_TIMEOUT = 10000;

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function normalizeTweetUrl(url: string): string | null {
  const match = url.match(/status\/(\d+)/);
  if (!match) return null;
  return `https://vxtwitter.com/i/status/${match[1]}`;
}

interface SnapshotResult {
  screenshotBase64: string;
  htmlContent: string;
  timestamp: string;
}

export class SnapshotService {
  private static browser: Browser | null = null;

  /**
   * Initialize the browser instance (reusable across requests)
   */
  private static async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close the browser instance
   */
  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Create a snapshot of a tweet using Puppeteer
   * Returns base64 encoded screenshot and HTML content
   */
  static async createSnapshot(url: string): Promise<SnapshotResult | null> {
    const normalized = normalizeTweetUrl(url);

    if (!normalized) {
      logger.warn('Invalid tweet URL', { url });
      return null;
    }

    let page: Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Set viewport - using 1x scale instead of 2x to reduce size
      // 900px width is good for tweets while keeping file size manageable
      await page.setViewport({
        width: 900,
        height: 1600,
        deviceScaleFactor: 1,
      });

      // Set a realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      logger.info('Loading tweet page', { url: normalized });

      // Navigate to the tweet
      await page.goto(normalized, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      // Wait for content to load and the main article to appear
      try {
        await page.waitForSelector('article', { timeout: 5000 });
      } catch (e) {
        logger.warn('article selector not found, falling back to full viewport', { url: normalized });
      }

      // Add a small buffer for heavy media
      await sleep(1500);

      // Get the HTML content
      const htmlContent = await page.content();

      // Find the tweet element and take a clipped screenshot
      let screenshotBuffer: string;
      const element = await page.$('article');

      if (element) {
        const boundingBox = await element.boundingBox();
        if (boundingBox) {
          screenshotBuffer = await page.screenshot({
            type: 'jpeg',
            quality: 85,
            clip: {
              x: boundingBox.x,
              y: boundingBox.y,
              width: boundingBox.width,
              height: boundingBox.height,
            },
            encoding: 'base64',
          }) as string;
        } else {
          screenshotBuffer = await page.screenshot({
            type: 'jpeg',
            quality: 85,
            encoding: 'base64',
          }) as string;
        }
      } else {
        screenshotBuffer = await page.screenshot({
          type: 'jpeg',
          quality: 85,
          encoding: 'base64',
        }) as string;
      }

      const screenshotBase64 = `data:image/jpeg;base64,${screenshotBuffer}`;
      const base64Size = screenshotBase64.length;

      const timestamp = new Date().toISOString();

      logger.info('Snapshot created successfully', {
        timestamp,
        screenshotBufferSize: screenshotBuffer.length,
        base64Size: base64Size,
        htmlSize: htmlContent.length,
        totalSize: base64Size + htmlContent.length,
      });

      if (base64Size > 1000000) {
        logger.warn('Screenshot size exceeds Firestore limit, will be rejected', {
          base64Size,
          limit: 1048487,
        });
      }

      return {
        screenshotBase64,
        htmlContent,
        timestamp,
      };
    } catch (err) {
      logger.error('Snapshot creation failed', { url: normalized, error: err });
      return null;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Create a snapshot with retry logic
   */
  static async createSnapshotWithRetry(
    url: string,
    maxRetries = 3
  ): Promise<SnapshotResult | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.createSnapshot(url);
        if (result) {
          return result;
        }
        logger.warn('Snapshot attempt failed, retrying...', { attempt, url });
      } catch (err) {
        logger.error('Snapshot attempt error', { attempt, url, error: err });
      }

      if (attempt < maxRetries) {
        await sleep(2000 * attempt); // Exponential backoff
      }
    }

    logger.error('All snapshot attempts failed', { url, maxRetries });
    return null;
  }
}