import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { clickByExactText } from './clickByExactText.js';
import { stage } from './stageLog.js';

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

/** Accept cookie banner if present — absence is OK (already accepted / A/B). */
async function acceptCookies(page: Page): Promise<void> {
    const handle = await page
        .waitForSelector(SELECTORS.COOKIE_ACCEPT, { timeout: TIMEOUTS.SHORT * 3, visible: true })
        .catch(() => null);
    if (handle) {
        await handle.click().catch(() => undefined);
        stage('cookies', 'accepted');
        await settle(400);
        return;
    }

    const byText =
        (await clickByExactText(page, 'Принять', { timeout: TIMEOUTS.SHORT })) ||
        (await clickByExactText(page, 'Согласен', { timeout: TIMEOUTS.SHORT }));
    if (byText) {
        stage('cookies', 'accepted (text)');
        await settle(400);
    }
}

/** Region / promo / generic closers that block login CTA. */
async function dismissBlockingOverlays(page: Page): Promise<void> {
    await page
        .evaluate((selectors) => {
            const pick = (sel: string) => document.querySelector(sel) as HTMLElement | null;
            pick(selectors.REGION_BUTTON)?.click();
            pick(selectors.RESPONSE_POPUP_CLOSE)?.click();
            pick(selectors.ADDITIONAL_DATA_COLLECTOR_CLOSE)?.click();
            // Magritte / Bloko common dismiss affordances
            (
                document.querySelector(
                    '[data-qa="modal-close"], [data-qa="bloko-modal-close"], button[aria-label="Закрыть"]',
                ) as HTMLElement | null
            )?.click();
        }, SELECTORS)
        .catch(() => undefined);
    await settle(300);
}

/**
 * Fresh session hygiene before Magritte login: cookies + dismiss popups.
 * Does not fail the run when banners are missing.
 */
export async function dismissPreLoginOverlays(page: Page): Promise<void> {
    await acceptCookies(page);
    await dismissBlockingOverlays(page);
}
