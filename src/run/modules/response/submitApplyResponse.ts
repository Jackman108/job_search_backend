import { Page } from 'puppeteer';
import { SELECTORS } from '@config';
import { scrollToElementIfNotFound } from '../../helpers/scrollToElementIfNotFound.js';

/**
 * Prefer Magritte «без вопросов» link, then popup/page RESPONSE_SUBMIT variants.
 * Quick `$` for optional no-questions so missing control does not burn SEARCH timeout.
 */
export async function submitApplyResponse(page: Page): Promise<boolean> {
    const noQuestions = await page.$(SELECTORS.RESPONSE_LINK_NO_QUESTIONS);
    if (noQuestions) {
        await noQuestions.click();
        return true;
    }

    const submit = await scrollToElementIfNotFound(page, SELECTORS.RESPONSE_SUBMIT);
    if (submit) {
        await submit.click();
        return true;
    }

    return false;
}
