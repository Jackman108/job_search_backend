import { Page } from 'puppeteer';

/** Chrome UA close to bundled Chromium; HH fingerprinting keys off webdriver + headless tells. */
export const HH_STEALTH_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Soften common Puppeteer automation fingerprints before first navigation.
 * Not a guarantee against CAPTCHA — reduces navigator.webdriver / langs / chrome gaps.
 */
export async function applyStealth(page: Page): Promise<void> {
    await page.setUserAgent(HH_STEALTH_UA);
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    await page.emulateTimezone('Europe/Moscow').catch(() => undefined);

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        w.chrome = w.chrome || { runtime: {} };

        Object.defineProperty(navigator, 'languages', {
            get: () => ['ru-RU', 'ru', 'en-US', 'en'],
        });

        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
        });

        const originalQuery = window.navigator.permissions?.query?.bind(window.navigator.permissions);
        if (originalQuery) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window.navigator.permissions as any).query = (parameters: PermissionDescriptor) =>
                parameters.name === 'notifications'
                    ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
                    : originalQuery(parameters);
        }
    });
}
