//index.ts
import * as dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { ENV, ENV_BROWSER_CONFIG } from '@config';
import { Counters, SendFeedbackParams } from '@interface';
import type { ScenarioDeps } from '../job/processJob.deps.js';
import { isStopped, stop } from '@utils';
import { authorize, initializeBrowser, navigateAndProcessVacancies, searchForVacancy } from '@run';

dotenv.config();

export async function sendFeedback(
    { userId, email, password, position, message, vacancyUrl }: SendFeedbackParams,
    deps: Pick<ScenarioDeps, 'vacancyRepo' | 'broadcast'>,
): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const counters: Counters = {
        successfullySubmittedCount: 0,
        unsuccessfullySubmittedCount: 0,
    };

    try {
        browser = await puppeteer.launch(ENV_BROWSER_CONFIG[ENV.NODE_ENV]);
        page = await browser.newPage();

        const isInitialized = await initializeBrowser(vacancyUrl, browser, page, deps.broadcast);
        if (!isInitialized) return;

        await authorize(page, email, password, browser, deps.broadcast);
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

        await navigateAndProcessVacancies({
            userId,
            page,
            counters,
            message,
            browser,
            vacancyRepo: deps.vacancyRepo,
            broadcast: deps.broadcast,
        });
        await page.screenshot({ path: 'screenshot-navigate.png' });
        console.log(`Total number of forms successfully submitted: ${counters.successfullySubmittedCount}`);
    } catch (err) {
        console.error('Error during script execution:', err);
        // Rethrow so processJob can mark the job file as error (poll SoT).
        throw err;
    } finally {
        if (browser && page && !page.isClosed()) {
            await stop(browser);
        }
    }
}
