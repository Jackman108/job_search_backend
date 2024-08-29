// stopManager.ts
import { Browser } from "puppeteer";
let shouldStop = false;

export async function stop(browser: Browser) {
    shouldStop = true;
    if (browser) {
        await browser.close();
    }
}

export function reset() {
    shouldStop = false;
}

export function isStopped() {
    return shouldStop;
}
