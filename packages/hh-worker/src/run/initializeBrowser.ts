import { Browser, Page } from 'puppeteer';
import { TIMEOUTS } from '@config';
import { reset, stop } from '@utils';
import type { JobBroadcast } from '../job/broadcast.types.js';
import { clearBrowserSession } from './helpers/clearBrowserSession.js';
import { dismissPreLoginOverlays } from './helpers/dismissPreLoginOverlays.js';
import { stage } from './helpers/stageLog.js';

export async function initializeBrowser(vacancyUrl: string, browser: Browser, page: Page, broadcast: JobBroadcast) {
    try {
        reset();
        await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
        // Clearing session forces a cold fingerprint and often *increases* CAPTCHA rate.
        // Opt-in only: HH_CLEAR_SESSION=1 (warm profile HH_USER_DATA_DIR never clears).
        const clearSession = process.env.HH_CLEAR_SESSION?.trim().toLowerCase();
        if ((clearSession === '1' || clearSession === 'true') && !process.env.HH_USER_DATA_DIR?.trim()) {
            await clearBrowserSession(page);
        }

        await page.goto(vacancyUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });
        stage('browser open', vacancyUrl.slice(0, 80));

        // Cookie accept + region/promo closers — missing banner must NOT abort the job.
        await dismissPreLoginOverlays(page);

        // Soft check: page still usable (not a hard HH outage shell).
        const title = await page.title().catch(() => '');
        if (/ошибка|unavailable|just a moment/i.test(title)) {
            broadcast.broadcast('hh closed');
            await page.screenshot({ path: 'screenshot-closed.png' }).catch(() => null);
            await stop(browser);
            return false;
        }

        return { browser, page };
    } catch (error) {
        await stop(browser);
        console.error('Error initializing browser page:', error);
        return false;
    }
}
