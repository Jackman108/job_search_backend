// stopManager.js
let shouldStop = false;

export async function stop(browser) {
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
