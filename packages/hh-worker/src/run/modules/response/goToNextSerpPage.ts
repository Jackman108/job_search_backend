import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { delayBetweenPages } from '@utils';
import { stage } from '../../helpers/stageLog.js';

/**
 * Advance Magritte SERP pager and wait for the next card list.
 * Uses DOM click (not a cached ElementHandle) so re-renders do not detach.
 */
export async function goToNextSerpPage(page: Page): Promise<boolean> {
    const hasNext = await page.$(SELECTORS.PAGER_NEXT);
    if (!hasNext) return false;

    stage('next page');
    await page.screenshot({ path: 'next_page.png' }).catch(() => undefined);

    const beforeHref = page.url();
    const beforeFirstId = await page
        .evaluate((cardSel) => {
            const link = document.querySelector(`${cardSel} a[href*="/vacancy/"]`) as HTMLAnchorElement | null;
            return link?.href || '';
        }, SELECTORS.VACANCY_CARD)
        .catch(() => '');

    const clicked = await page
        .evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) return false;
            el.scrollIntoView({ block: 'center' });
            el.click();
            return true;
        }, SELECTORS.PAGER_NEXT)
        .catch(() => false);

    if (!clicked) return false;

    await Promise.race([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => null),
        page
            .waitForFunction((prev) => location.href !== prev, { timeout: TIMEOUTS.LONG }, beforeHref)
            .catch(() => null),
        page
            .waitForFunction(
                (cardSel, prevFirst) => {
                    const link = document.querySelector(`${cardSel} a[href*="/vacancy/"]`) as HTMLAnchorElement | null;
                    const href = link?.href || '';
                    return Boolean(href) && href !== prevFirst;
                },
                { timeout: TIMEOUTS.LONG },
                SELECTORS.VACANCY_CARD,
                beforeFirstId,
            )
            .catch(() => null),
    ]);

    const cards = await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG }).catch(() => null);
    if (!cards) {
        stage('next page', 'no cards after pager');
        return false;
    }

    const pageWaitMs = await delayBetweenPages();
    stage('pace', `${pageWaitMs}ms after pager`);
    return true;
}
