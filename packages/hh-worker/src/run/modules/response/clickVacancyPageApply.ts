import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

const APPLY_TEXT_RE = /Откликнуться/i;

/**
 * Fallback when SERP CTA is missing/virtualized: open vacancy page and click apply there.
 */
export async function clickVacancyPageApply(page: Page, vacancyUrl: string): Promise<boolean> {
    if (!vacancyUrl || !/\/vacancy\//i.test(vacancyUrl)) return false;

    await page.goto(vacancyUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => undefined);
    await settle(TIMEOUTS.SHORT * 2);

    const selectors = [
        SELECTORS.RESPONSE_LINK_NO_QUESTIONS,
        SELECTORS.RESPONSE_LINK_TOP,
        SELECTORS.VACANCY_RESPONSE,
        SELECTORS.RESPONSE_SUBMIT,
    ];

    const hit = await page
        .evaluate(
            (sels, applyReSource) => {
                const applyRe = new RegExp(applyReSource, 'i');
                for (const sel of sels) {
                    const el = document.querySelector(sel) as HTMLElement | null;
                    if (!el) continue;
                    el.scrollIntoView({ block: 'center', inline: 'nearest' });
                    el.click();
                    return { ok: true, via: sel };
                }
                const byText = Array.from(document.querySelectorAll('a, button, [role="button"]')).find((el) =>
                    applyRe.test(el.textContent || ''),
                ) as HTMLElement | undefined;
                if (!byText) return { ok: false, via: 'none' };
                byText.scrollIntoView({ block: 'center', inline: 'nearest' });
                byText.click();
                return { ok: true, via: 'text' };
            },
            selectors,
            APPLY_TEXT_RE.source,
        )
        .catch(() => ({ ok: false, via: 'throw' }));

    if (!hit?.ok) {
        console.log(`clickVacancyPageApply miss via=${hit?.via ?? 'unknown'}`);
        return false;
    }

    await settle();
    return true;
}
