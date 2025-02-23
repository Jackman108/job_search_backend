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
            console.log('✅ Browser successfully stopped.');
        } catch (err) {
            console.error('❌ Error stopping browser:', err);
        }
    } else {
        console.warn('⚠️ No browser instance found.');
    }
}

export function reset() {
    shouldStop = false;
}

export function isStopped() {
    return shouldStop;
}
