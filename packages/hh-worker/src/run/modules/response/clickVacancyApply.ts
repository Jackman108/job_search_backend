import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

type ClickHit = { ok: true; x: number; y: number } | { ok: false };

/**
 * Click «Откликнуться» for a vacancy id on the current SERP.
 * Always re-queries the DOM — Magritte re-renders cards after goBack / apply.
 */
export async function clickVacancyApply(page: Page, vacancyId: number): Promise<boolean> {
    await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG }).catch(() => null);

    for (let attempt = 1; attempt <= 5; attempt++) {
        const hit = (await page
            .evaluate(
                (id, cardSel, responseSel) => {
                    const needle = `/vacancy/${id}`;

                    const tryClick = (el: HTMLElement | null): ClickHit => {
                        if (!el) return { ok: false };
                        el.scrollIntoView({ block: 'center', inline: 'nearest' });
                        const rect = el.getBoundingClientRect();
                        if (rect.width < 2 || rect.height < 2) return { ok: false };
                        el.click();
                        return {
                            ok: true,
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2,
                        };
                    };

                    const cards = Array.from(document.querySelectorAll(cardSel));
                    for (const card of cards) {
                        const link = card.querySelector(`a[href*="${needle}"]`) as HTMLAnchorElement | null;
                        if (!link) continue;

                        const response = card.querySelector(responseSel) as HTMLElement | null;
                        const viaResponse = tryClick(response);
                        if (viaResponse.ok) return viaResponse;

                        const byText = Array.from(card.querySelectorAll('a, button')).find((el) =>
                            /Откликнуться/i.test(el.textContent || ''),
                        ) as HTMLElement | undefined;
                        const viaText = tryClick(byText || null);
                        if (viaText.ok) return viaText;
                    }

                    const loose = Array.from(document.querySelectorAll(responseSel)).find((el) => {
                        const root = el.closest(cardSel) || el.parentElement;
                        return Boolean(root?.querySelector(`a[href*="${needle}"]`));
                    }) as HTMLElement | undefined;
                    const viaLoose = tryClick(loose || null);
                    if (viaLoose.ok) return viaLoose;

                    // Last resort: any Откликнуться near a matching vacancy href on the page.
                    const near = Array.from(document.querySelectorAll('a, button')).find((el) => {
                        if (!/Откликнуться/i.test(el.textContent || '')) return false;
                        const root = el.closest(cardSel) || el.parentElement;
                        return Boolean(root?.querySelector(`a[href*="${needle}"]`));
                    }) as HTMLElement | undefined;
                    return tryClick(near || null);
                },
                vacancyId,
                SELECTORS.VACANCY_CARD,
                SELECTORS.VACANCY_RESPONSE,
            )
            .catch(() => ({ ok: false }) as ClickHit)) as ClickHit;

        if (hit.ok) {
            // Magritte sometimes ignores programmatic click — reinforce with CDP mouse.
            await page.mouse.click(hit.x, hit.y).catch(() => undefined);
            await settle();
            return true;
        }

        await page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.75)));
        await settle(TIMEOUTS.SHORT);
    }

    return false;
}
