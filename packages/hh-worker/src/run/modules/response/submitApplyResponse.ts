import { Page } from 'puppeteer';
import { SELECTORS } from '@market-hunter/hh-worker/config';
import { scrollToElementIfNotFound } from '../../helpers/scrollToElementIfNotFound.js';

/**
 * Prefer Magritte «без вопросов» link, then popup/page RESPONSE_SUBMIT variants.
 * Prefer DOM evaluate clicks — ElementHandle.click often hits detached Magritte nodes.
 */
function clickVisible(sel: string): boolean {
    const nodes = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
    for (const el of nodes) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        if (!el.getClientRects().length) continue;
        el.click();
        return true;
    }
    return false;
}

export async function submitApplyResponse(page: Page): Promise<boolean> {
    const viaNoQuestions = await page.evaluate(clickVisible, SELECTORS.RESPONSE_LINK_NO_QUESTIONS).catch(() => false);
    if (viaNoQuestions) return true;

    const viaEvaluate = await page.evaluate(clickVisible, SELECTORS.RESPONSE_SUBMIT).catch(() => false);
    if (viaEvaluate) return true;

    const submit = await scrollToElementIfNotFound(page, SELECTORS.RESPONSE_SUBMIT);
    if (submit) {
        const box = await submit.boundingBox().catch(() => null);
        if (box) {
            await submit.click().catch(() => undefined);
            return true;
        }
    }

    // Magritte modal CTA is often plain «Откликнуться» inside role=dialog (no RESPONSE_SUBMIT qa).
    const viaDialog = await page
        .evaluate(() => {
            const visible = (el: Element | null) => {
                if (!el) return false;
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
                return el.getClientRects().length > 0;
            };
            const dialogs = Array.from(
                document.querySelectorAll(
                    '[role="dialog"], [data-qa*="response-popup"], [data-qa*="vacancy-response"]',
                ),
            );
            for (const d of dialogs) {
                if (!visible(d)) continue;
                const nodes = Array.from(d.querySelectorAll('a, button, [role="button"]'));
                for (const n of nodes) {
                    const text = (n.textContent || '').replace(/\s+/g, ' ').trim();
                    if (text !== 'Откликнуться' && !/^Откликнуться\b/i.test(text)) continue;
                    if (!visible(n)) continue;
                    (n as HTMLElement).click();
                    return true;
                }
            }
            return false;
        })
        .catch(() => false);
    return viaDialog;
}
