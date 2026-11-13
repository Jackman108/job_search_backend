import { createRequire } from 'node:module';
import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { readVacancyPageTitle } from '../../helpers/readVacancyPageTitle.js';

const require = createRequire(import.meta.url);
const clickVacancyPageApplyInPage = require('./clickVacancyPageApply.browser.js') as (sels: string[]) => {
    ok: boolean;
    via: string;
};

export type ClickVacancyPageApplyResult = {
    ok: boolean;
    /** Captured before apply click — Magritte often drops H1 after response CTA. */
    title?: string;
    via?: string;
};

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

/**
 * Fallback when SERP CTA is missing/virtualized: open vacancy page and click apply.
 * Browser logic in clickVacancyPageApply.browser.js (tsx-safe).
 */
export async function clickVacancyPageApply(page: Page, vacancyUrl: string): Promise<ClickVacancyPageApplyResult> {
    if (!vacancyUrl || !/\/vacancy\//i.test(vacancyUrl)) return { ok: false };

    await page.goto(vacancyUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => undefined);
    await settle(TIMEOUTS.SHORT * 2);

    await page
        .evaluate((cookieSel: string) => {
            const btn = document.querySelector(cookieSel) as HTMLElement | null;
            if (btn) btn.click();
        }, SELECTORS.COOKIE_ACCEPT)
        .catch(() => undefined);
    await settle();

    // Title must be read before apply — response UI replaces vacancy H1 / document.title.
    const title = await readVacancyPageTitle(page);

    const selectors = [
        SELECTORS.RESPONSE_LINK_NO_QUESTIONS,
        SELECTORS.RESPONSE_LINK_TOP,
        SELECTORS.VACANCY_RESPONSE.split(',')[0].trim(),
        SELECTORS.RESPONSE_SUBMIT,
    ];

    let hit: { ok: boolean; via: string };
    try {
        hit = (await page.evaluate(clickVacancyPageApplyInPage, selectors)) as { ok: boolean; via: string };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`clickVacancyPageApply evaluate error: ${msg}`);
        return { ok: false, title };
    }

    if (!hit?.ok) {
        console.log(`clickVacancyPageApply miss via=${hit?.via ?? 'unknown'}`);
        await page.screenshot({ path: 'screenshot-vacancy-page-no-apply.png' }).catch(() => null);
        return { ok: false, title, via: hit?.via };
    }

    await settle(TIMEOUTS.SHORT * 2);
    return { ok: true, title, via: hit.via };
}
