import Tesseract from 'tesseract.js';
import { SELECTORS, TIMEOUTS } from '../constants.js';

// Функция для распознавания изображения капчи
async function recognizeCaptcha(file, lang, logger) {
    return Tesseract.recognize(file, lang, { logger })
        .then(({ data: { text } }) => {
            return text;
        });
}

// Функция для обновления прогресса распознавания
function updateProgress(data) {
    console.log(`${data.status}: ${(data.progress * 100).toFixed(2)}%`);
}

// Функция для решения капчи
export async function solveCaptcha(page) {
    try {
        const captchaHandle = await page.waitForSelector(SELECTORS.CAPTCHA_IMAGE, { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        if (captchaHandle) {
            const captchaImageBuffer = await captchaHandle.screenshot({ type: 'png' });
            console.log('Captured CAPTCHA image.');

            const text = await recognizeCaptcha(captchaImageBuffer, 'rus', updateProgress);
            console.log('Detected CAPTCHA text:', text.trim());

            await page.type(SELECTORS.CAPTCHA_INPUT, text.trim());
            console.log('Entered CAPTCHA text.');
        } else {
            await page.screenshot({ path: 'screenshot-authorize.png' });
            console.error('CAPTCHA image not found.');

        }
    } catch (error) {
        await page.screenshot({ path: 'screenshot-authorize.png' });
        console.error('Error while solving CAPTCHA:', error);
    }
}