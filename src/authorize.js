import { SELECTORS, TIMEOUTS } from '../constants.js';
//import { solveCaptcha } from '../utils/solveCaptcha.js';
import { stop } from '../utils/stopManager.js';
import { broadcast } from '../server/startWebSocketServer.js';

// Функция для авторизации
export async function authorize(page, email, password) {
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
        } else {
            console.log('CLOSE button not found');
        }
       
        await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));

        const passwordToggleHandle = await page.waitForSelector(
            SELECTORS.PASSWORD_BUTTON,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (passwordToggleHandle) {
            await page.click(SELECTORS.PASSWORD_BUTTON);
        } else {
            console.error('PASSWORD button not found');
        }

        const emailHandle = await page.waitForSelector(
            SELECTORS.EMAIL_INPUT,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (emailHandle) {
            await page.type(SELECTORS.EMAIL_INPUT, email);
        } else {
            console.error('INPUT EMAIL not found');
        }

        const passwordHandle = await page.waitForSelector(
            SELECTORS.PASSWORD_INPUT,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (passwordHandle) {
            await page.type(SELECTORS.PASSWORD_INPUT, password);
        } else {
            console.error('INPUT PASSWORD not found');
        }

        const submitHandle = await page.waitForSelector(
            SELECTORS.LOGIN_SUBMIT,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (submitHandle) {
            await page.click(SELECTORS.LOGIN_SUBMIT);
            console.log('Clicked SUBMIT button');
            await page.screenshot({ path: 'screenshot-authorize1.png' });
        } else {
            console.error('SUBMIT button not found');
        }

        const capchaHandle = await page.waitForSelector(
            SELECTORS.CAPTCHA_IMAGE,
            { timeout: TIMEOUTS.SEARCH, visible: true}).catch(() => null);

        const errorHandle = await page.waitForSelector(
            SELECTORS.LOGIN_ERROR,
            { timeout: TIMEOUTS.SEARCH, visible: true}).catch(() => null);
            
            switch (true) {
                case !!errorHandle:
                    broadcast('ERROR detected, restart');
                    await page.screenshot({ path: 'screenshot-ERROR.png' });
                    stop();
                    return;
                case !!capchaHandle:
                    broadcast('CAPTCHA detected, restart');
                    await page.screenshot({ path: 'screenshot-CAPTCHA.png' });
                    stop();
                    return;                
                default:
                    console.log('No CAPTCHA or ERROR detected, proceeding with login.');
            }

    } catch (error) {
        console.error('Error during authorization:', error);
    }
}
