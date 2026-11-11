import { Page } from 'puppeteer';
import { SELECTORS } from '@config';
import { scrollToElementIfNotFound } from '../../helpers/scrollToElementIfNotFound.js';

/**
 * Prefer Magritte «без вопросов» link, then popup/page RESPONSE_SUBMIT variants.
 * Prefer DOM evaluate clicks — ElementHandle.click often hits detached Magritte nodes.
 */
export async function submitApplyResponse(page: Page): Promise<boolean> {
    const viaNoQuestions = await page
        .evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) return false;
            el.click();
            return true;
        }, SELECTORS.RESPONSE_LINK_NO_QUESTIONS)
        .catch(() => false);
    if (viaNoQuestions) return true;

    const submit = await scrollToElementIfNotFound(page, SELECTORS.RESPONSE_SUBMIT);
    if (!submit) return false;

    const viaEvaluate = await page
        .evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) return false;
            el.click();
            return true;
        }, SELECTORS.RESPONSE_SUBMIT)
        .catch(() => false);
    if (viaEvaluate) return true;

    await submit.click().catch(() => undefined);
    return true;
}
