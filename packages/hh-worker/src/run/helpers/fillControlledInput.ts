import { Page } from 'puppeteer';

type ElementHandle = NonNullable<Awaited<ReturnType<Page['waitForSelector']>>>;

/** Magritte controlled inputs: clear + native value setter so React sees the change. */
export async function fillControlledInput(page: Page, handle: ElementHandle, value: string): Promise<void> {
    await handle.click({ clickCount: 3 }).catch(() => undefined);
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await handle.evaluate((el, next) => {
        const input = el as HTMLInputElement;
        const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        proto?.set?.call(input, next);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
}
