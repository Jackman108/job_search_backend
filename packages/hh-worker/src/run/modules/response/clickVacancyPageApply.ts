import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

/**
 * Fallback when SERP CTA is missing/virtualized: open vacancy page and click apply there.
 * Keep page.evaluate free of TypeScript types — Puppeteer stringifies the function body.
 */
export async function clickVacancyPageApply(page: Page, vacancyUrl: string): Promise<boolean> {
    if (!vacancyUrl || !/\/vacancy\//i.test(vacancyUrl)) return false;

    await page.goto(vacancyUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => undefined);
    await settle(TIMEOUTS.SHORT * 2);

    // Cookie banner can sit over the CTA.
    await page
        .evaluate((cookieSel) => {
            const btn = document.querySelector(cookieSel);
            if (btn) (btn as HTMLElement).click();
        }, SELECTORS.COOKIE_ACCEPT)
        .catch(() => undefined);
    await settle();

    const selectors = [
        SELECTORS.RESPONSE_LINK_NO_QUESTIONS,
        SELECTORS.RESPONSE_LINK_TOP,
        SELECTORS.VACANCY_RESPONSE.split(',')[0].trim(),
        SELECTORS.RESPONSE_SUBMIT,
    ];

    let hit: { ok: boolean; via: string };
    try {
        hit = (await page.evaluate((sels: string[]) => {
            for (let i = 0; i < sels.length; i++) {
                const el = document.querySelector(sels[i]) as HTMLElement | null;
                if (!el) continue;
                el.scrollIntoView({ block: 'center', inline: 'nearest' });
                el.click();
                return { ok: true, via: sels[i] };
            }
            const nodes = document.querySelectorAll('a, button, [role="button"]');
            for (let i = 0; i < nodes.length; i++) {
                const el = nodes[i] as HTMLElement;
                const text = (el.textContent || '').trim();
                if (text !== 'Откликнуться' && !/^Откликнуться\b/i.test(text)) continue;
                el.scrollIntoView({ block: 'center', inline: 'nearest' });
                el.click();
                return { ok: true, via: 'text' };
            }
            return { ok: false, via: 'none' };
        }, selectors)) as { ok: boolean; via: string };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`clickVacancyPageApply evaluate error: ${msg}`);
        return false;
    }

    if (!hit?.ok) {
        console.log(`clickVacancyPageApply miss via=${hit?.via ?? 'unknown'}`);
        await page.screenshot({ path: 'screenshot-vacancy-page-no-apply.png' }).catch(() => null);
        return false;
    }

    await settle(TIMEOUTS.SHORT * 2);
    return true;
}
