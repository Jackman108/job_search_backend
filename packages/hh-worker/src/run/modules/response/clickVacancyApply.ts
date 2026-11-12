import { createRequire } from 'node:module';
import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

const require = createRequire(import.meta.url);
/** Plain CJS browser fn — must not pass through tsx `__name` rewrite. */
const clickVacancyApplyInPage = require('./clickVacancyApply.browser.js') as (
    id: number,
    cardSelector: string,
    responseSelector: string,
) => { ok: true; x: number; y: number; via: string } | { ok: false; reason: string };

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

/**
 * Click «Откликнуться» for a vacancy id on the current SERP.
 * Browser logic lives in clickVacancyApply.browser.js (tsx-safe).
 */
export async function clickVacancyApply(page: Page, vacancyId: number): Promise<boolean> {
    const cardSel = SELECTORS.VACANCY_CARD.split(',')[0].trim();
    const responseSel = SELECTORS.VACANCY_RESPONSE.split(',')[0].trim();

    await page.waitForSelector(cardSel, { timeout: TIMEOUTS.LONG }).catch(() => null);

    for (let attempt = 1; attempt <= 6; attempt++) {
        if (attempt === 1 || attempt === 4) {
            await page.evaluate(() => window.scrollTo(0, 0));
        } else if (attempt % 2 === 0) {
            await page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.6)));
        } else {
            await page.evaluate(() => window.scrollBy(0, -Math.floor(window.innerHeight * 0.4)));
        }
        await settle(TIMEOUTS.SHORT);

        let hit: ReturnType<typeof clickVacancyApplyInPage>;
        try {
            hit = (await page.evaluate(clickVacancyApplyInPage, vacancyId, cardSel, responseSel)) as ReturnType<
                typeof clickVacancyApplyInPage
            >;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log(`clickVacancyApply evaluate error id=${vacancyId}: ${msg}`);
            hit = { ok: false, reason: 'evaluate_throw' };
        }

        if (hit.ok) {
            await page.mouse.click(hit.x, hit.y).catch(() => undefined);
            await settle();
            return true;
        }

        if (attempt === 6) {
            console.log(`clickVacancyApply miss id=${vacancyId} reason=${hit.reason}`);
        }
    }

    return false;
}
