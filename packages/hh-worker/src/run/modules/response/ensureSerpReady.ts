import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

async function isOnSerp(page: Page): Promise<boolean> {
    return page
        .evaluate(() => /\/search\/vacancy/i.test(location.pathname) || /vacancy_search/i.test(location.href))
        .catch(() => false);
}

/** After apply / goBack, wait until Magritte SERP cards are interactive again. */
export async function ensureSerpReady(page: Page, serpUrl?: string): Promise<void> {
    if (!(await isOnSerp(page))) {
        if (serpUrl) {
            await page.goto(serpUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => undefined);
        } else {
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => undefined);
        }
    }

    let cards = await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG }).catch(() => null);

    // goBack can land on login/account — hard recover via known SERP URL.
    if (!cards && serpUrl) {
        await page.goto(serpUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => undefined);
        cards = await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG }).catch(() => null);
    }

    if (!cards) {
        throw new Error('SERP cards not ready after apply/navigation');
    }

    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));
}
