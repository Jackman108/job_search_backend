import puppeteer, { Browser, Page } from 'puppeteer';
import { ENV, ENV_BROWSER_CONFIG, resolvePuppeteerHeadless } from '@config';
import { applyStealth } from './applyStealth.js';
import { stage } from './stageLog.js';

export type LaunchedHhBrowser = {
    browser: Browser;
    page: Page;
};

/** Launch Chromium for HH with stealth args + first-page patches. */
export async function launchHhBrowser(): Promise<LaunchedHhBrowser> {
    const headless = resolvePuppeteerHeadless();
    const userDataDir = process.env.HH_USER_DATA_DIR?.trim() || undefined;
    const browser = await puppeteer.launch({
        ...ENV_BROWSER_CONFIG[ENV.NODE_ENV],
        headless,
        userDataDir,
    });
    const page = await browser.newPage();
    await applyStealth(page);
    stage('stealth', headless ? 'headless+patches' : 'headed+patches');
    if (userDataDir) stage('profile', userDataDir);
    return { browser, page };
}
