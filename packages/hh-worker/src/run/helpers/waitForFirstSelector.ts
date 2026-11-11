import { ElementHandle, Page } from 'puppeteer';
import { TIMEOUTS } from '@config';

export type FirstSelectorMatch = {
    handle: ElementHandle<Element>;
    selector: string;
};

/**
 * Prefer selectors in order (primary first). Uses a combined CSS wait so either
 * variant can appear, then returns the first preferred match still in the DOM.
 * Additive HH Magritte/login fallbacks — does not replace the primary data-qa.
 */
export async function waitForFirstSelector(
    page: Page,
    selectors: readonly string[],
    options?: { timeout?: number; visible?: boolean },
): Promise<FirstSelectorMatch | null> {
    const list = selectors.filter(Boolean);
    if (list.length === 0) return null;

    const timeout = options?.timeout ?? TIMEOUTS.SEARCH;
    const visible = options?.visible;
    const combined = list.join(', ');
    const any = await page
        .waitForSelector(combined, { timeout, ...(visible === undefined ? {} : { visible }) })
        .catch(() => null);
    if (!any) return null;

    for (const selector of list) {
        const handle = await page.$(selector);
        if (handle) return { handle, selector };
    }

    return { handle: any, selector: combined };
}

export async function clickFirstSelector(
    page: Page,
    selectors: readonly string[],
    options?: { timeout?: number; visible?: boolean },
): Promise<FirstSelectorMatch | null> {
    const match = await waitForFirstSelector(page, selectors, options);
    if (!match) return null;
    await match.handle.click();
    return match;
}

export async function typeFirstSelector(
    page: Page,
    selectors: readonly string[],
    text: string,
    options?: { timeout?: number; visible?: boolean },
): Promise<FirstSelectorMatch | null> {
    const match = await waitForFirstSelector(page, selectors, options);
    if (!match) return null;
    await match.handle.type(text);
    return match;
}
