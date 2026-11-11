//index.ts
import * as dotenv from 'dotenv';
import { Browser, Page } from 'puppeteer';
import { Counters, SendFeedbackParams } from '@interface';
import type { ScenarioDeps } from '../job/processJob.deps.js';
import { isStopped, stop } from '@utils';
import { authorize, initializeBrowser, navigateAndProcessVacancies, searchForVacancy } from '@run';
import { launchHhBrowser } from './helpers/launchHhBrowser.js';
import { stage } from './helpers/stageLog.js';

dotenv.config();

export async function sendFeedback(
    { userId, email, password, position, message, vacancyUrl }: SendFeedbackParams,
    deps: Pick<ScenarioDeps, 'vacancyRepo' | 'broadcast'> & { jobId: string },
): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const counters: Counters = {
        successfullySubmittedCount: 0,
        unsuccessfullySubmittedCount: 0,
    };

    try {
        stage('start', `user=${userId}`);
        ({ browser, page } = await launchHhBrowser());

        const isInitialized = await initializeBrowser(vacancyUrl, browser, page, deps.broadcast);
        if (!isInitialized) return;

        stage('login');
        await authorize(page, email, password, browser, deps.broadcast, deps.jobId);
        if (isStopped()) {
            stage('stopped', 'before search');
            await stop(browser);
            return;
        }

        // Login leaves applicant home /account — reopen the form SERP before typing.
        stage('search', position);
        await searchForVacancy({ page, position, vacancyUrl });
        if (isStopped()) {
            stage('stopped', 'before apply loop');
            await stop(browser);
            return;
        }

        stage('apply loop');
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
        stage('done', `ok=${counters.successfullySubmittedCount} fail=${counters.unsuccessfullySubmittedCount}`);
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
