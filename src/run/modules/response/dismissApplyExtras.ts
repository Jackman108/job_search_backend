import { Page } from 'puppeteer';
import { SELECTORS } from '@config';

/** Close Magritte post-submit / profile-completion overlays if present. */
export async function dismissApplyExtras(page: Page): Promise<void> {
    await page.evaluate((selectors) => {
        const close = document.querySelector(
            `${selectors.ADDITIONAL_DATA_COLLECTOR_CLOSE}, ${selectors.RESPONSE_POPUP_CLOSE}`,
        ) as HTMLElement | null;
        close?.click();
    }, SELECTORS);
}
