//getFeedback.ts
import * as dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { ENV, ENV_BROWSER_CONFIG, SELECTORS_CHAT } from '@config';
import { GetFeedbackParams } from '@interface';
import { isStopped, stop } from '@utils';
import { authorize, navigateAndProcessChats, initializeBrowser } from '@run';

dotenv.config();

export async function getFeedback({
    userId,
    email,
    password,
}: GetFeedbackParams): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        browser = await puppeteer.launch(ENV_BROWSER_CONFIG[ENV.NODE_ENV]);
        page = await browser.newPage();

        const isInitialized = await initializeBrowser(SELECTORS_CHAT.CHAT_URL, browser, page);
        if (!isInitialized) return;

        await authorize(page, email, password, browser);
        await page.screenshot({ path: 'screenshot-authorize.png' });
        if (isStopped()) {
            console.log('🛑 Script stopped before authorization.');
            await stop(browser);
            return;
        }

        await navigateAndProcessChats({ userId, page, browser });

    } catch (err) {
        console.error('Error during script execution:', err);
    } finally {
        if (browser && page && !page.isClosed()) {
            await stop(browser);
        }
    }
}
