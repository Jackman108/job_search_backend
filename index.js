//index.js
import puppeteer from 'puppeteer';
import { browserConfig } from './config.js';
import { authorize } from './src/authorize.js';
import { searchForVacancy } from './src/searchForVacancy.js';
import { navigateAndProcessVacancies } from './src/navigateAndProcessVacancies.js';
import { SELECTORS, TIMEOUTS } from './constants.js';
import { reset, stop, isStopped } from './utils/stopManager.js';
import * as dotenv from 'dotenv';
import { broadcast } from './server/startWebSocketServer.js';
dotenv.config();


export async function runPuppeteerScript({ email, password, position, message, vacancyUrl }) {
    const browser = await puppeteer.launch(browserConfig);
    const page = await browser.newPage();

    let counters = {
        successfullySubmittedCount: 0,
        unsuccessfullySubmittedCount: 0
    };

    try {
        reset();
        await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1, });
        await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));

        await page.goto(vacancyUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });

        const coockeHandle = await page.waitForSelector(
            SELECTORS.COOKIE_ACCEPT,
            { timeout: TIMEOUTS.SEARCH, visible: true }).catch(() => null);
        if (!coockeHandle || isStopped()) {
            broadcast('hh closed');
            await page.screenshot({ path: 'screenshot-closed.png' });
            stop();
            return;
        } else {
            await page.click(SELECTORS.COOKIE_ACCEPT);
        }

        await authorize(page, email, password);
        await page.screenshot({ path: 'screenshot-authorize.png' });
        if (isStopped()) {
            stop();
            console.log('The script is stopped after authorization.');
            return;
        }

        await searchForVacancy(page, position);
        await page.screenshot({ path: 'screenshot-search.png' });
        if (isStopped()) {
            stop();
            console.log('The script is stopped after the job search.');
            return;
        }

        await navigateAndProcessVacancies(page, counters, message, isStopped);
        await page.screenshot({ path: 'screenshot-navigate.png' });
        console.log(`Total number of forms successfully submitted: ${counters.successfullySubmittedCount}`);

    } catch (err) {
        console.error('Error during script execution:', err);
    } finally {
        stop();
    }
}
