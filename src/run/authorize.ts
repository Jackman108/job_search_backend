import { SELECTORS, TIMEOUTS } from '@config';
import { stop } from '@utils';
import { Browser, Page } from 'puppeteer';
import { broadcast } from '@server';

export async function authorize(
    page: Page,
    email: string,
    password: string,
    browser: Browser
): Promise<void> {
    try {
        const loginHandle = await page.waitForSelector(
            SELECTORS.LOGIN,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (loginHandle) {
            await page.click(SELECTORS.LOGIN);
        } else {
            console.error('LOGIN button not found');
        }

        const closeButtonHandle = await page.waitForSelector(
            SELECTORS.REGION_BUTTON,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (closeButtonHandle) {
            await page.click(SELECTORS.REGION_BUTTON);
            await page.click(SELECTORS.LOGIN);
        }

        await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));

        // LOGIN_SUBMIT includes submit-button + account-login-submit fallbacks.
        const submitButtonHandle = await page.waitForSelector(
            SELECTORS.LOGIN_SUBMIT,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (submitButtonHandle) {
            await submitButtonHandle.click();
        } else {
            console.error('SUBMIT button not found');
        }

        const emailButtonHandle = await page.waitForSelector(
            SELECTORS.EMAIL_BUTTON,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (emailButtonHandle) {
            await emailButtonHandle.click();
        } else {
            console.error('EMAIL button not found');
        }


        const emailHandle = await page.waitForSelector(
            SELECTORS.EMAIL_INPUT,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (emailHandle) {
            await emailHandle.type(email);
        } else {
            console.error('INPUT EMAIL not found');
        }

        const passwordToggleHandle = await page.waitForSelector(
            SELECTORS.PASSWORD_BUTTON,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (passwordToggleHandle) {
            await passwordToggleHandle.click();
        } else {
            console.error('PASSWORD button not found');
        }


        // PASSWORD_INPUT includes applicant-login-input-password + login-input-password.
        const passwordHandle = await page.waitForSelector(
            SELECTORS.PASSWORD_INPUT,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (passwordHandle) {
            await passwordHandle.type(password);
        } else {
            console.error('INPUT PASSWORD not found');
        }

        const submitHandle = await page.waitForSelector(
            SELECTORS.LOGIN_SUBMIT,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (submitHandle) {
            await submitHandle.click();
            await page.screenshot({ path: 'screenshot-authorize1.png' });
        } else {
            console.error('SUBMIT button not found');
        }

        const captchaHandle = await page.waitForSelector(
            SELECTORS.CAPTCHA_IMAGE,
            { timeout: TIMEOUTS.SEARCH, visible: true }).catch(() => null);

        const errorHandle = await page.waitForSelector(
            SELECTORS.LOGIN_ERROR,
            { timeout: TIMEOUTS.SEARCH, visible: true }).catch(() => null);

        switch (true) {
            case !!errorHandle:
                broadcast('ERROR detected restart');
                await page.screenshot({ path: 'screenshot-ERROR.png' });
                await stop(browser);
                return;
            case !!captchaHandle:
                const captchaSrc = await page.evaluate((img: unknown) => {
                    const imageElement = img as HTMLImageElement;
                    return imageElement.src;
                }, captchaHandle as unknown);

                broadcast(`CAPTCHA detected restart ${captchaSrc}`);
                await page.screenshot({ path: 'screenshot-CAPTCHA.png' });
                await stop(browser);
                return;
            default:
                console.log('No CAPTCHA or ERROR detected');
        }

    } catch (error) {
        console.error('Error during authorization:', error);
    }
}
