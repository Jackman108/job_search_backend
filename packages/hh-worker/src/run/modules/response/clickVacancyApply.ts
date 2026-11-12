import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

/**
 * Click «Откликнуться» for a vacancy id on the current SERP.
 * Always re-queries the DOM — Magritte re-renders cards after goBack / apply.
 */
export async function clickVacancyApply(page: Page, vacancyId: number): Promise<boolean> {
    await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG }).catch(() => null);

    for (let attempt = 1; attempt <= 4; attempt++) {
        // Bring the card into the virtualized viewport before querying the CTA.
        await page
            .evaluate(
                (id, cardSel) => {
                    const cards = Array.from(document.querySelectorAll(cardSel));
                    for (const card of cards) {
                        const link = card.querySelector(`a[href*="/vacancy/${id}"]`) as HTMLAnchorElement | null;
                        if (!link) continue;
                        card.scrollIntoView({ block: 'center', inline: 'nearest' });
                        return true;
                    }
                    return false;
                },
                vacancyId,
                SELECTORS.VACANCY_CARD,
            )
            .catch(() => false);

        await settle(TIMEOUTS.SHORT);

        const clicked = await page
            .evaluate(
                (id, cardSel, responseSel) => {
                    const needle = `/vacancy/${id}`;
                    const cards = Array.from(document.querySelectorAll(cardSel));
                    for (const card of cards) {
                        const link = card.querySelector(`a[href*="${needle}"]`) as HTMLAnchorElement | null;
                        if (!link) continue;

                        const response = card.querySelector(responseSel) as HTMLElement | null;
                        if (response) {
                            response.scrollIntoView({ block: 'center', inline: 'nearest' });
                            response.click();
                            return true;
                        }

                        const byText = Array.from(card.querySelectorAll('a, button')).find((el) =>
                            /Откликнуться/i.test(el.textContent || ''),
                        ) as HTMLElement | undefined;
                        if (byText) {
                            byText.scrollIntoView({ block: 'center', inline: 'nearest' });
                            byText.click();
                            return true;
                        }
                    }

                    // Fallback: response control keyed by vacancy href anywhere on SERP.
                    const loose = Array.from(document.querySelectorAll(responseSel)).find((el) => {
                        const root = el.closest(cardSel) || el.parentElement;
                        return Boolean(root?.querySelector(`a[href*="${needle}"]`));
                    }) as HTMLElement | undefined;
                    if (loose) {
                        loose.scrollIntoView({ block: 'center', inline: 'nearest' });
                        loose.click();
                        return true;
                    }

                    return false;
                },
                vacancyId,
                SELECTORS.VACANCY_CARD,
                SELECTORS.VACANCY_RESPONSE,
            )
            .catch(() => false);

        if (clicked) {
            await settle();
            return true;
        }

        await page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.7)));
        await settle(TIMEOUTS.SHORT);
    }

    return false;
}
