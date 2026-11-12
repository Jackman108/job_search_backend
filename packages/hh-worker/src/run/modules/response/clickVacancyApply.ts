import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

type ClickHit = { ok: true; x: number; y: number; via: string } | { ok: false; reason: string };

const APPLY_TEXT_RE = /Откликнуться/i;

/**
 * Click «Откликнуться» for a vacancy id on the current SERP.
 * Always re-queries the DOM — Magritte re-renders cards after goBack / apply.
 */
export async function clickVacancyApply(page: Page, vacancyId: number): Promise<boolean> {
    await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG }).catch(() => null);

    for (let attempt = 1; attempt <= 6; attempt++) {
        // Odd attempts: jump near top so virtualized cards remount; even: nudge down.
        if (attempt === 1 || attempt === 4) {
            await page.evaluate(() => window.scrollTo(0, 0));
        } else if (attempt % 2 === 0) {
            await page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.6)));
        } else {
            await page.evaluate(() => window.scrollBy(0, -Math.floor(window.innerHeight * 0.4)));
        }
        await settle(TIMEOUTS.SHORT);

        const hit = (await page
            .evaluate(
                (id, cardSel, responseSel, applyReSource) => {
                    const needle = `/vacancy/${id}`;
                    const applyRe = new RegExp(applyReSource, 'i');

                    const tryClick = (el: HTMLElement | null, via: string): ClickHit => {
                        if (!el) return { ok: false, reason: `no_el:${via}` };
                        el.scrollIntoView({ block: 'center', inline: 'nearest' });
                        // Hover affordance — Magritte sometimes mounts CTA only after pointer.
                        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                        const rect = el.getBoundingClientRect();
                        // Still click zero-size / offscreen — CDP mouse may miss, DOM click can work.
                        try {
                            el.click();
                        } catch {
                            return { ok: false, reason: `click_throw:${via}` };
                        }
                        return {
                            ok: true,
                            x: Math.max(1, rect.left + Math.max(rect.width, 1) / 2),
                            y: Math.max(1, rect.top + Math.max(rect.height, 1) / 2),
                            via,
                        };
                    };

                    const findApplyIn = (root: ParentNode, viaPrefix: string): ClickHit => {
                        const byQa = root.querySelector(responseSel) as HTMLElement | null;
                        const viaQa = tryClick(byQa, `${viaPrefix}:qa`);
                        if (viaQa.ok) return viaQa;

                        const candidates = Array.from(
                            root.querySelectorAll('a, button, [role="button"], span, div'),
                        ) as HTMLElement[];
                        const byText = candidates.find((el) => applyRe.test(el.textContent || ''));
                        return tryClick(byText || null, `${viaPrefix}:text`);
                    };

                    const cards = Array.from(document.querySelectorAll(cardSel));
                    let sawCard = false;
                    for (const card of cards) {
                        const link = card.querySelector(`a[href*="${needle}"]`) as HTMLAnchorElement | null;
                        if (!link) continue;
                        sawCard = true;
                        (card as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' });
                        (card as HTMLElement).dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                        const hitCard = findApplyIn(card, 'card');
                        if (hitCard.ok) return hitCard;
                    }

                    // Response control may sit just outside the card wrapper.
                    const loose = Array.from(document.querySelectorAll(responseSel)).find((el) => {
                        const root = el.closest(cardSel) || el.parentElement;
                        return Boolean(root?.querySelector(`a[href*="${needle}"]`));
                    }) as HTMLElement | undefined;
                    const viaLoose = tryClick(loose || null, 'loose-qa');
                    if (viaLoose.ok) return viaLoose;

                    const near = Array.from(document.querySelectorAll('a, button, [role="button"]')).find((el) => {
                        if (!applyRe.test(el.textContent || '')) return false;
                        const root = el.closest(cardSel) || el.parentElement;
                        return Boolean(root?.querySelector(`a[href*="${needle}"]`));
                    }) as HTMLElement | undefined;
                    const viaNear = tryClick(near || null, 'near-text');
                    if (viaNear.ok) return viaNear;

                    return {
                        ok: false,
                        reason: sawCard ? 'card_no_apply' : 'card_missing',
                    };
                },
                vacancyId,
                SELECTORS.VACANCY_CARD,
                SELECTORS.VACANCY_RESPONSE,
                APPLY_TEXT_RE.source,
            )
            .catch(
                () =>
                    ({
                        ok: false,
                        reason: 'evaluate_throw',
                    }) as ClickHit,
            )) as ClickHit;

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
