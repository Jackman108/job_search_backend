import { Page } from 'puppeteer';
import { TIMEOUTS } from '@config';
import { waitForFirstSelector } from './waitForFirstSelector.js';

export async function scrollToElementIfNotFound(page: Page, selector: string | readonly string[]) {
    const selectors = typeof selector === 'string' ? [selector] : selector;
    let match = await waitForFirstSelector(page, selectors, { timeout: TIMEOUTS.SEARCH });

    if (!match) {
        console.log(`Element ${selectors.join(' | ')} not found, scrolling down the page...`);
        await page.screenshot({ path: 'Element-announce.png' });
        await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
        await new Promise((res) => setTimeout(res, TIMEOUTS.SHORT));
        match = await waitForFirstSelector(page, selectors, { timeout: TIMEOUTS.SEARCH });
    }

    return match?.handle ?? null;
}
