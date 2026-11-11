//getFeedback.ts
import * as dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { ENV, ENV_BROWSER_CONFIG, SELECTORS_CHAT } from '@config';
import { GetFeedbackParams } from '@interface';
import type { ScenarioDeps } from '../job/processJob.deps.js';
import { isStopped, stop } from '@utils';
import { authorize, navigateAndProcessChats, initializeBrowser } from '@run';
import { stage } from './helpers/stageLog.js';

dotenv.config();

export async function getFeedback(
    { userId, email, password }: GetFeedbackParams,
    deps: Pick<ScenarioDeps, 'feedbackRepo' | 'broadcast'>,
): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        stage('start feedback', `user=${userId}`);
        browser = await puppeteer.launch(ENV_BROWSER_CONFIG[ENV.NODE_ENV]);
        page = await browser.newPage();

        stage('browser open');
        const isInitialized = await initializeBrowser(SELECTORS_CHAT.CHAT_URL, browser, page, deps.broadcast);
        if (!isInitialized) return;

        stage('login');
        await authorize(page, email, password, browser, deps.broadcast);
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
