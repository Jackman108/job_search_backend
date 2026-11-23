import type { ElementHandle, Page } from 'puppeteer';

/**
 * Click without Puppeteer lifecycle wait. Magritte account-type «Войти» can
 * start a soft nav that never settles → ElementHandle.click → Navigation timeout.
 */
export async function clickDomHandle(handle: ElementHandle<Element>): Promise<void> {
    await handle.evaluate((el) => {
        if (el instanceof HTMLElement) el.click();
    });
}

/** CSS click in-page (no navigation wait). Returns false if node missing. */
export async function clickDomSelector(page: Page, selector: string): Promise<boolean> {
    return page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!(el instanceof HTMLElement)) return false;
        el.click();
        return true;
    }, selector);
}
