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

    for (let attempt = 1; attempt <= 3; attempt++) {
        const clicked = await page
            .evaluate(
                (id, cardSel, responseSel) => {
                    const cards = Array.from(document.querySelectorAll(cardSel));
                    for (const card of cards) {
                        const link = card.querySelector('a[href*="/vacancy/"]') as HTMLAnchorElement | null;
                        if (!link?.href?.includes(`/vacancy/${id}`)) continue;

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

        await page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.6)));
        await settle(TIMEOUTS.SHORT);
    }

    return false;
}
