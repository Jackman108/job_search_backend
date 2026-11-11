//getFeedback.ts
import * as dotenv from 'dotenv';
import { Browser, Page } from 'puppeteer';
import { SELECTORS_CHAT } from '@config';
import { GetFeedbackParams } from '@interface';
import type { ScenarioDeps } from '../job/processJob.deps.js';
import { isStopped, stop } from '@utils';
import { authorize, navigateAndProcessChats, initializeBrowser } from '@run';
import { launchHhBrowser } from './helpers/launchHhBrowser.js';
import { stage } from './helpers/stageLog.js';

dotenv.config();

export async function getFeedback(
    { userId, email, password }: GetFeedbackParams,
    deps: Pick<ScenarioDeps, 'feedbackRepo' | 'broadcast'> & { jobId: string },
): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        stage('start feedback', `user=${userId}`);
        ({ browser, page } = await launchHhBrowser());

        const isInitialized = await initializeBrowser(SELECTORS_CHAT.CHAT_URL, browser, page, deps.broadcast);
        if (!isInitialized) return;

        stage('login');
        await authorize(page, email, password, browser, deps.broadcast, deps.jobId);
        await page.screenshot({ path: 'screenshot-authorize.png' });
        if (isStopped()) {
            stage('stopped', 'before chats');
            await stop(browser);
            return;
        }

        stage('chats');
        await navigateAndProcessChats({
            userId,
            page,
            browser,
            feedbackRepo: deps.feedbackRepo,
        });
        stage('done feedback');
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
