import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

type ClickHit = { ok: true; x: number; y: number; via: string } | { ok: false; reason: string };

/**
 * Click «Откликнуться» for a vacancy id on the current SERP.
 * Always re-queries the DOM — Magritte re-renders cards after goBack / apply.
 *
 * Keep the page.evaluate body free of TypeScript types — Puppeteer stringifies it.
 */
export async function clickVacancyApply(page: Page, vacancyId: number): Promise<boolean> {
    const cardSel = SELECTORS.VACANCY_CARD.split(',')[0].trim();
    const responseSel = SELECTORS.VACANCY_RESPONSE.split(',')[0].trim();

    await page.waitForSelector(cardSel, { timeout: TIMEOUTS.LONG }).catch(() => null);

    for (let attempt = 1; attempt <= 6; attempt++) {
        if (attempt === 1 || attempt === 4) {
            await page.evaluate(() => window.scrollTo(0, 0));
        } else if (attempt % 2 === 0) {
            await page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.6)));
        } else {
            await page.evaluate(() => window.scrollBy(0, -Math.floor(window.innerHeight * 0.4)));
        }
        await settle(TIMEOUTS.SHORT);

        let hit: ClickHit;
        try {
            hit = (await page.evaluate(
                (id: number, cardSelector: string, responseSelector: string) => {
                    const needle = '/vacancy/' + id;

                    function tryClick(el: any, via: string) {
                        if (!el) return { ok: false, reason: 'no_el:' + via };
                        el.scrollIntoView({ block: 'center', inline: 'nearest' });
                        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                        const rect = el.getBoundingClientRect();
                        try {
                            el.click();
                        } catch {
                            return { ok: false, reason: 'click_throw:' + via };
                        }
                        return {
                            ok: true,
                            x: Math.max(1, rect.left + Math.max(rect.width, 1) / 2),
                            y: Math.max(1, rect.top + Math.max(rect.height, 1) / 2),
                            via: via,
                        };
                    }

                    function findApplyIn(root: any, viaPrefix: string) {
                        const byQa = root.querySelector(responseSelector);
                        const viaQa = tryClick(byQa, viaPrefix + ':qa');
                        if (viaQa.ok) return viaQa;

                        const nodes = root.querySelectorAll('a, button, [role="button"]');
                        for (let i = 0; i < nodes.length; i++) {
                            const el = nodes[i];
                            if (/Откликнуться/i.test(el.textContent || '')) {
                                return tryClick(el, viaPrefix + ':text');
                            }
                        }
                        return { ok: false, reason: 'no_apply:' + viaPrefix };
                    }

                    const cards = document.querySelectorAll(cardSelector);
                    let sawCard = false;
                    for (let i = 0; i < cards.length; i++) {
                        const card = cards[i];
                        const link = card.querySelector('a[href*="' + needle + '"]');
                        if (!link) continue;
                        sawCard = true;
                        card.scrollIntoView({ block: 'center', inline: 'nearest' });
                        card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                        const hitCard = findApplyIn(card, 'card');
                        if (hitCard.ok) return hitCard;
                    }

                    const responses = document.querySelectorAll(responseSelector);
                    for (let i = 0; i < responses.length; i++) {
                        const el = responses[i];
                        const root = el.closest(cardSelector) || el.parentElement;
                        if (root && root.querySelector('a[href*="' + needle + '"]')) {
                            const viaLoose = tryClick(el, 'loose-qa');
                            if (viaLoose.ok) return viaLoose;
                        }
                    }

                    const all = document.querySelectorAll('a, button, [role="button"]');
                    for (let i = 0; i < all.length; i++) {
                        const el = all[i];
                        if (!/Откликнуться/i.test(el.textContent || '')) continue;
                        const root = el.closest(cardSelector) || el.parentElement;
                        if (root && root.querySelector('a[href*="' + needle + '"]')) {
                            return tryClick(el, 'near-text');
                        }
                    }

                    return {
                        ok: false,
                        reason: sawCard ? 'card_no_apply' : 'card_missing',
                    };
                },
                vacancyId,
                cardSel,
                responseSel,
            )) as ClickHit;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log(`clickVacancyApply evaluate error id=${vacancyId}: ${msg}`);
            hit = { ok: false, reason: 'evaluate_throw' };
        }

        if (hit.ok) {
            await page.mouse.click(hit.x, hit.y).catch(() => undefined);
            await settle();
            return true;
        }

        if (attempt === 6) {
            console.log(`clickVacancyApply miss id=${vacancyId} reason=${hit.reason}`);
        }
    }

    return false;
}
