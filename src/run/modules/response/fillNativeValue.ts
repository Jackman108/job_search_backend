import { Page } from 'puppeteer';

/**
 * Magritte/React inputs often ignore ElementHandle.type — set via native
 * value setter + InputEvent('input') so controlled components update.
 */
export async function fillNativeValue(page: Page, selector: string, value: string): Promise<boolean> {
    return page.evaluate(
        (sel, text) => {
            const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
            if (!el) return false;
            const proto =
                el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
            const desc = Object.getOwnPropertyDescriptor(proto, 'value');
            if (!desc?.set) return false;
            desc.set.call(el, text);
            el.dispatchEvent(new InputEvent('input', { bubbles: true }));
            return true;
        },
        selector,
        value,
    );
}
