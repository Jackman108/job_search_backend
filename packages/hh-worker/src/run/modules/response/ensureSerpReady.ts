import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

/** After apply / goBack, wait until Magritte SERP cards are interactive again. */
export async function ensureSerpReady(page: Page): Promise<void> {
    const onSerp = await page
        .evaluate(() => /\/search\/vacancy/i.test(location.pathname) || /vacancy_search/i.test(location.href))
        .catch(() => false);

    if (!onSerp) {
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => undefined);
    }

    await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG }).catch(() => undefined);
    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));
}
