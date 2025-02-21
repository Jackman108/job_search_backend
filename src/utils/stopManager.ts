// stopManager.ts
import {Browser} from "puppeteer";

let shouldStop = false;

export async function stop(browser: Browser) {
    shouldStop = true;
    if (browser) {
        try {
            const pages = await browser.pages();
            for (const page of pages) {
                if (!page.isClosed()) {
                    await page.close();
                }
            }
            await browser.close();
        } catch (err) {
            console.error('Error stopping browser:', err);
        }
    }
}

export function reset() {
    shouldStop = false;
}

export function isStopped() {
    return shouldStop;
}
