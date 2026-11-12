import { Browser, Page } from 'puppeteer';
import { TIMEOUTS } from '@config';
import { reset, stop } from '@utils';
import type { JobBroadcast } from '../job/broadcast.types.js';
import { clearBrowserSession } from './helpers/clearBrowserSession.js';
import { dismissPreLoginOverlays } from './helpers/dismissPreLoginOverlays.js';
import { stage } from './helpers/stageLog.js';

async function gotoWithRetry(page: Page, vacancyUrl: string): Promise<void> {
    // HH sometimes stalls past 60s under headless even when curl/IWR returns 200.
    const long = Math.max(TIMEOUTS.LONG, 120_000);
    const attempts: Array<{ waitUntil: 'domcontentloaded' | 'load'; timeout: number }> = [
        { waitUntil: 'domcontentloaded', timeout: long },
        { waitUntil: 'load', timeout: long },
    ];
    let lastErr: unknown;
    for (let i = 0; i < attempts.length; i++) {
        const opts = attempts[i];
        try {
            await page.goto(vacancyUrl, opts);
            return;
        } catch (err) {
            lastErr = err;
            stage('browser open retry', `${i + 1}/${attempts.length}: ${String(err).slice(0, 120)}`);
            await new Promise((r) => setTimeout(r, 1500));
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

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

        await gotoWithRetry(page, vacancyUrl);
        stage('browser open', vacancyUrl.slice(0, 80));

        // Cookie accept + region/promo closers — missing banner must NOT abort the job.
        await dismissPreLoginOverlays(page);

        // Soft check: page still usable (not a hard HH outage shell).
        const title = await page.title().catch(() => '');
        if (/ошибка|unavailable|just a moment/i.test(title)) {
            broadcast.broadcast('hh closed');
            await page.screenshot({ path: 'screenshot-closed.png' }).catch(() => null);
            await stop(browser);
            throw new Error(`HH page unavailable (title=${title || 'empty'})`);
        }

        return { browser, page };
    } catch (error) {
        await stop(browser).catch(() => undefined);
        console.error('Error initializing browser page:', error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
