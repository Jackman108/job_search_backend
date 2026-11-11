import puppeteer, { Browser, Page } from 'puppeteer';
import { ENV, ENV_BROWSER_CONFIG } from '@config';
import { applyStealth } from './applyStealth.js';
import { stage } from './stageLog.js';

export type LaunchedHhBrowser = {
    browser: Browser;
    page: Page;
};

/** Launch Chromium for HH with stealth args + first-page patches. */
export async function launchHhBrowser(): Promise<LaunchedHhBrowser> {
    const browser = await puppeteer.launch(ENV_BROWSER_CONFIG[ENV.NODE_ENV]);
    const page = await browser.newPage();
    await applyStealth(page);
    stage('stealth', 'ua+webdriver patches');
    return { browser, page };
}
