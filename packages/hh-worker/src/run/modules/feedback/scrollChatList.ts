import { Page } from 'puppeteer';
import { SELECTORS_CHAT, TIMEOUTS } from '@market-hunter/hh-worker/config';

/** Scroll the chatik sidebar so more chat cards virtualize into the DOM. */
export async function scrollChatList(page: Page): Promise<number> {
    const before = await page.$$eval(SELECTORS_CHAT.CHAT_CARD, (els) => els.length).catch(() => 0);

    await page
        .evaluate(
            (cardSel, listSel) => {
                const cards = document.querySelectorAll(cardSel);
                const last = cards[cards.length - 1] as HTMLElement | undefined;
                if (last) {
                    last.scrollIntoView({ block: 'end' });
                }
                const roots = document.querySelectorAll(listSel);
                for (const root of Array.from(roots)) {
                    const el = root as HTMLElement;
                    if (el.scrollHeight > el.clientHeight + 8) {
                        el.scrollTop = el.scrollHeight;
                    }
                }
                window.scrollBy(0, Math.floor(window.innerHeight * 0.8));
            },
            SELECTORS_CHAT.CHAT_CARD,
            SELECTORS_CHAT.CHAT_LIST_SCROLL,
        )
        .catch(() => undefined);

    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));
    const after = await page.$$eval(SELECTORS_CHAT.CHAT_CARD, (els) => els.length).catch(() => before);
    return after;
}

/** Keep scrolling while the visible card count grows (cap attempts). */
export async function expandChatList(page: Page, maxAttempts = 8): Promise<number> {
    let count = await page.$$eval(SELECTORS_CHAT.CHAT_CARD, (els) => els.length).catch(() => 0);
    for (let i = 0; i < maxAttempts; i++) {
        const next = await scrollChatList(page);
        if (next <= count) break;
        count = next;
    }
    return count;
}
