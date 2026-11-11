import { ElementHandle, Page } from 'puppeteer';
import { TIMEOUTS } from '@config';

/**
 * Click a visible button/link whose trimmed textContent equals `text`.
 * Prefer data-qa CSS first via callers; this is Magritte RU-label fallback.
 */
export async function clickByExactText(
    page: Page,
    text: string,
    options?: { timeout?: number },
): Promise<ElementHandle<Element> | null> {
    const timeout = options?.timeout ?? TIMEOUTS.SEARCH;
    const started = Date.now();

    while (Date.now() - started < timeout) {
        const handle = await page.evaluateHandle((label) => {
            const nodes = Array.from(document.querySelectorAll('button, [role="button"], a, input[type="submit"]'));
            return (
                nodes.find((el) => {
                    const raw =
                        el instanceof HTMLInputElement
                            ? el.value || el.getAttribute('aria-label') || ''
                            : el.textContent || '';
                    return raw.replace(/\s+/g, ' ').trim() === label;
                }) ?? null
            );
        }, text);

        const el = handle.asElement() as ElementHandle<Element> | null;
        if (el) {
            const box = await el.boundingBox().catch(() => null);
            if (box) {
                await el.click();
                return el;
            }
        }
        await handle.dispose().catch(() => undefined);
        await new Promise((r) => setTimeout(r, 200));
    }

    return null;
}
