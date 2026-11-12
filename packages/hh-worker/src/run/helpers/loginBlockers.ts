import { SELECTORS, TIMEOUTS } from '@config';
import { stop } from '@utils';
import { Browser, Page } from 'puppeteer';
import type { JobBroadcast } from '../../job/broadcast.types.js';
import { waitAndSubmitCaptchaAnswer } from './waitForCaptchaAnswer.js';
import { clickFirstSelector } from './waitForFirstSelector.js';
import { clickByExactText } from './clickByExactText.js';
import { stage } from './stageLog.js';

const LABEL_SUBMIT = 'Войти';

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickLoginSubmit(page: Page): Promise<void> {
    const byQa = await clickFirstSelector(page, [SELECTORS.LOGIN_SUBMIT], {
        timeout: TIMEOUTS.SEARCH,
        visible: true,
    });
    if (byQa) return;

    const byText = await clickByExactText(page, LABEL_SUBMIT, { timeout: TIMEOUTS.SEARCH });
    if (!byText) {
        throw new Error('HH login: login submit / Войти not found');
    }
}

export async function pageHasBadCredentials(page: Page): Promise<boolean> {
    const bySelector = await page.$(SELECTORS.LOGIN_ERROR).catch(() => null);
    if (bySelector) return true;
    return page
        .evaluate(() => {
            const text = document.body?.innerText || '';
            return /Неправильные данные для входа|неверн(ый|ые|ая)\s+(пароль|логин|данные)/i.test(text);
        })
        .catch(() => false);
}

async function handleCaptchaGate(page: Page, browser: Browser, broadcast: JobBroadcast, jobId: string): Promise<void> {
    const captchaHandle = await page.$(SELECTORS.CAPTCHA_IMAGE);
    const captchaSrc = captchaHandle
        ? await page.evaluate((img) => (img as HTMLImageElement).src, captchaHandle).catch(() => '')
        : '';
    broadcast.broadcast(`CAPTCHA detected restart ${captchaSrc}`);
    await page.screenshot({ path: 'screenshot-CAPTCHA.png' }).catch(() => null);

    const solved = await waitAndSubmitCaptchaAnswer(jobId, page, captchaSrc || '');
    if (solved) {
        if (await page.$(SELECTORS.PASSWORD_INPUT)) {
            await clickLoginSubmit(page).catch(() => undefined);
            await settle(TIMEOUTS.SHORT * 2);
        }
        await page
            .waitForFunction(() => !location.pathname.includes('/account/login'), {
                timeout: TIMEOUTS.MODAL,
            })
            .catch(() => undefined);
        stage('login', 'continued after captcha answer');
        return;
    }

    await stop(browser);
    throw new Error(`CAPTCHA detected restart ${captchaSrc || ''}`.trim());
}

export async function submitAndDetectBlockers(
    page: Page,
    browser: Browser,
    broadcast: JobBroadcast,
    jobId: string,
): Promise<void> {
    await clickLoginSubmit(page);
    await settle(TIMEOUTS.SHORT * 2);
    await page.screenshot({ path: 'screenshot-authorize1.png' }).catch(() => null);

    const leftLogin = page
        .waitForFunction(() => !location.pathname.includes('/account/login'), { timeout: TIMEOUTS.MODAL })
        .then(() => 'ok' as const)
        .catch(() => null);
    const loginError = page
        .waitForSelector(SELECTORS.LOGIN_ERROR, { timeout: TIMEOUTS.MODAL, visible: true })
        .then(() => 'error' as const)
        .catch(() => null);
    const loginErrorText = page
        .waitForFunction(
            () =>
                /Неправильные данные для входа|неверн(ый|ые|ая)\s+(пароль|логин|данные)/i.test(
                    document.body?.innerText || '',
                ),
            { timeout: TIMEOUTS.MODAL },
        )
        .then(() => 'error' as const)
        .catch(() => null);
    const captcha = page
        .waitForSelector(SELECTORS.CAPTCHA_IMAGE, { timeout: TIMEOUTS.MODAL, visible: true })
        .then(() => 'captcha' as const)
        .catch(() => null);
    const otp = page
        .waitForSelector(SELECTORS.OTP_CODE_INPUT, { timeout: TIMEOUTS.MODAL, visible: true })
        .then(() => 'otp' as const)
        .catch(() => null);

    let outcome = await Promise.race([leftLogin, loginError, loginErrorText, captcha, otp]);

    if (!outcome) {
        if (await pageHasBadCredentials(page)) outcome = 'error';
        else if (await page.$(SELECTORS.CAPTCHA_IMAGE)) outcome = 'captcha';
        else if (await page.$(SELECTORS.OTP_CODE_INPUT)) outcome = 'otp';
    }

    if (outcome === 'ok') {
        console.log('HH login completed (left /account/login)');
        return;
    }

    if (outcome === 'error') {
        broadcast.broadcast('ERROR detected restart');
        await page.screenshot({ path: 'screenshot-ERROR.png' }).catch(() => null);
        await stop(browser);
        throw new Error('HH login failed: invalid email or password');
    }

    if (outcome === 'otp') {
        throw new Error('HH login requires OTP (not supported in headless worker)');
    }

    if (outcome === 'captcha') {
        await handleCaptchaGate(page, browser, broadcast, jobId);
        return;
    }

    const stillPassword = await page.$(SELECTORS.PASSWORD_INPUT);
    const stillForm = await page.$(SELECTORS.ACCOUNT_LOGIN_FORM);
    if (stillForm && stillPassword) {
        await page.screenshot({ path: 'screenshot-authorize-stuck.png' }).catch(() => null);
        if (await pageHasBadCredentials(page)) {
            await stop(browser);
            throw new Error('HH login failed: invalid email or password');
        }
        if (await page.$(SELECTORS.CAPTCHA_IMAGE)) {
            await handleCaptchaGate(page, browser, broadcast, jobId);
            return;
        }
        throw new Error('HH login did not complete (still on login form)');
    }

    console.log('HH login submitted (no CAPTCHA / login error gate hit)');
}
