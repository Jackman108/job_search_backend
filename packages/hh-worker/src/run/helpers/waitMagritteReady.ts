import { TIMEOUTS } from '@config';
import type { Page } from 'puppeteer';

/** Magritte often paints submit as a spinner before the next step mounts. */
export async function waitMagritteLoaderGone(page: Page, timeout = TIMEOUTS.MODAL): Promise<void> {
    await page
        .waitForFunction(
            () => {
                const loaders = Array.from(document.querySelectorAll('[data-qa="magritte-loader"]'));
                if (!loaders.length) return true;
                return loaders.every((el) => {
                    const style = window.getComputedStyle(el);
                    return style.display === 'none' || style.visibility === 'hidden' || !el.getClientRects().length;
                });
            },
            { timeout },
        )
        .catch(() => undefined);
}

/** After account-type submit — email tab, email input, or password expand. */
export async function waitLoginCredentialStep(page: Page, timeout = TIMEOUTS.MODAL): Promise<boolean> {
    const handle = await page
        .waitForFunction(
            () => {
                const sels = [
                    '[data-qa="applicant-login-input-email"]',
                    '[data-qa^="credential-type-email"]',
                    '[data-qa="expand-login-by-password"]',
                    '[data-qa="applicant-login-input-password"]',
                    'input[type="password"]',
                ];
                return sels.some((s) => !!document.querySelector(s));
            },
            { timeout },
        )
        .catch(() => null);
    return Boolean(handle);
}
