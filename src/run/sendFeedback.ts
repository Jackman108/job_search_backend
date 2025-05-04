//index.ts
import * as dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { ENV, ENV_BROWSER_CONFIG } from '@config';
import { Counters, SendFeedbackParams } from '@interface';
import { isStopped, stop } from '@utils';
import { authorize, initializeBrowser, navigateAndProcessVacancies, searchForVacancy } from '@run';

dotenv.config();

export async function sendFeedback({
    userId,
    email,
    password,
    position,
    message,
    vacancyUrl
}: SendFeedbackParams): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const counters: Counters = {
        successfullySubmittedCount: 0,
        unsuccessfullySubmittedCount: 0
    };

    try {
        browser = await puppeteer.launch(ENV_BROWSER_CONFIG[ENV.NODE_ENV]);
        page = await browser.newPage();

        const isInitialized = await initializeBrowser(vacancyUrl, browser, page);
        if (!isInitialized) return;

        await authorize(page, email, password, browser);
        if (isStopped()) {
            console.log('🛑 Script stopped before authorization.');
            await stop(browser);
            return;
        }

        await searchForVacancy({ page, position });
        if (isStopped()) {
            console.log('🛑 Script stopped before searching for a vacancy.');
            await stop(browser);
            return;
        }

        await navigateAndProcessVacancies({ userId, page, counters, message, browser });
        await page.screenshot({ path: 'screenshot-navigate.png' });
        console.log(`Total number of forms successfully submitted: ${counters.successfullySubmittedCount}`);

    } catch (err) {
        console.error('Error during script execution:', err);
    } finally {
        if (browser && page && !page.isClosed()) {
            await stop(browser);
        }
    }
}
