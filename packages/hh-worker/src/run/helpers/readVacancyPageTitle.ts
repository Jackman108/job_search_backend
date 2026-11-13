import { Page } from 'puppeteer';
import { SELECTORS } from '@config';
import { normalizeHhVacancyTitle } from './normalizeHhVacancyTitle.js';

/**
 * Read vacancy title from an open Magritte vacancy page (H1 → og:title → document.title).
 * Call before clicking apply — Magritte often replaces the H1 after the response CTA.
 */
export async function readVacancyPageTitle(page: Page): Promise<string> {
    const raw = await page
        .evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            const fromEl = (el?.innerText || el?.textContent || '').trim();
            const og = document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || '';
            const doc = (document.title || '').trim();
            return fromEl || og || doc;
        }, SELECTORS.VACANCY_PAGE_TITLE)
        .catch(() => '');

    return normalizeHhVacancyTitle(raw);
}
