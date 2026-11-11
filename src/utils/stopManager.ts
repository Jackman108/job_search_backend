/** Duck-typed browser surface — API utils stay free of puppeteer type imports. */
export type StoppableBrowser = {
    pages: () => Promise<Array<{ isClosed: () => boolean; close: () => Promise<void> }>>;
    close: () => Promise<void>;
};

let shouldStop = false;

export async function stop(browser?: StoppableBrowser | null) {
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
