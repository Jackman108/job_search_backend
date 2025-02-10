import {Page} from "puppeteer";
import {TIMEOUTS} from "../../constants.js";

export async function scrollToElementIfNotFound(page: Page, selector: string) {
    let element = await page.waitForSelector(selector, {timeout: TIMEOUTS.SEARCH}).catch(() => null);

    if (!element) {
        console.log(`Element ${selector} not found, scrolling down the page...`);
        await page.screenshot({path: 'Element-announce.png'});
        await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
        await new Promise(res => setTimeout(res, TIMEOUTS.SHORT));
        element = await page.waitForSelector(selector, {timeout: TIMEOUTS.SEARCH}).catch(() => null);
    }

    return element;
}