import { SELECTORS, TIMEOUTS } from '@config';
import { stop } from '@utils';
import { Browser, Page } from 'puppeteer';
import type { JobBroadcast } from '../../job/broadcast.types.js';
import { clickByExactText } from './clickByExactText.js';
import { stage } from './stageLog.js';
import { loginErrorTextMatches, loginTransientReloadMatches } from './loginErrorText.js';
import { waitAndSubmitCaptchaAnswer } from './waitForCaptchaAnswer.js';
import { clickFirstSelector } from './waitForFirstSelector.js';
import { waitMagritteLoaderGone } from './waitMagritteReady.js';

const LABEL_SUBMIT = 'Войти';

/** Magritte toast «перезагрузить страницу» — authorize retries login once. */
export class MagritteLoginTransientError extends Error {
    constructor() {
        super('HH login Magritte transient error (reload)');
        this.name = 'MagritteLoginTransientError';
    }
}

export type SubmitLoginOptions = {
    /** True after Magritte reload toast already triggered one full login retry. */
    afterTransientRetry?: boolean;
};

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function readBodyText(page: Page): Promise<string> {
    return page.evaluate(() => document.body?.innerText || '').catch(() => '');
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
    return loginErrorTextMatches(await readBodyText(page));
}

async function throwCredentialOrTransient(
    page: Page,
    browser: Browser,
    broadcast: JobBroadcast,
    afterTransientRetry: boolean,
): Promise<never> {
    const body = await readBodyText(page);
    await page.screenshot({ path: 'screenshot-ERROR.png' }).catch(() => null);

    if (!afterTransientRetry && loginTransientReloadMatches(body)) {
        broadcast.broadcast('ERROR Magritte reload toast — retry login once');
        throw new MagritteLoginTransientError();
    }

    broadcast.broadcast('ERROR detected restart');
    await stop(browser);
    if (loginTransientReloadMatches(body)) {
        throw new Error('HH login Magritte error (reload) — retry headed or check CAPTCHA');
    }
    throw new Error('HH login failed: invalid email or password');
}

async function handleCaptchaGate(page: Page, browser: Browser, broadcast: JobBroadcast, jobId: string): Promise<void> {
    const captchaSrc = await page
        .evaluate((sel) => {
            const nodes = Array.from(document.querySelectorAll(sel)) as HTMLImageElement[];
            const hit = nodes.find((img) => /captcha\/picture/i.test(img.currentSrc || img.src || ''));
            return hit?.currentSrc || hit?.src || '';
        }, SELECTORS.CAPTCHA_IMAGE)
        .catch(() => '');
    broadcast.broadcast(`CAPTCHA detected restart ${captchaSrc || 'local-image'}`);
    await page.screenshot({ path: 'screenshot-CAPTCHA.png' }).catch(() => null);

    const solved = await waitAndSubmitCaptchaAnswer(jobId, page, captchaSrc || '');
    if (!solved) {
        await stop(browser);
        throw new Error(
            `HH login CAPTCHA not solved (wrong answer / timeout)${captchaSrc ? ` ${captchaSrc}` : ''}`.trim(),
        );
    }

    if (await page.$(SELECTORS.PASSWORD_INPUT)) {
        await clickLoginSubmit(page).catch(() => undefined);
        await settle(TIMEOUTS.SHORT * 2);
    }

    const leftLogin = await page
        .waitForFunction(() => !location.pathname.includes('/account/login'), {
            timeout: TIMEOUTS.MODAL,
        })
        .then(() => true)
        .catch(() => false);

    if (leftLogin) {
        stage('login', 'continued after captcha answer');
        return;
    }

    if (await pageHasBadCredentials(page)) {
        await stop(browser);
        throw new Error('HH login failed: invalid email or password');
    }
    if (await page.$(SELECTORS.CAPTCHA_IMAGE)) {
        await stop(browser);
        throw new Error('HH login CAPTCHA still present after answer');
    }
    await stop(browser);
    throw new Error('HH login did not complete after CAPTCHA (still on login form)');
}

export async function submitAndDetectBlockers(
    page: Page,
    browser: Browser,
    broadcast: JobBroadcast,
    jobId: string,
    opts: SubmitLoginOptions = {},
): Promise<void> {
    const afterTransientRetry = opts.afterTransientRetry === true;

    await clickLoginSubmit(page);
    await settle(TIMEOUTS.SHORT * 2);
    // Magritte paints Войти as a spinner; race outcomes only after it settles.
    await waitMagritteLoaderGone(page, TIMEOUTS.LONG);
    await page.screenshot({ path: 'screenshot-authorize1.png' }).catch(() => null);

    const leftLogin = page
        .waitForFunction(() => !location.pathname.includes('/account/login'), { timeout: TIMEOUTS.LONG })
        .then(() => 'ok' as const)
        .catch(() => null);
    const loginError = page
        .waitForSelector(SELECTORS.LOGIN_ERROR, { timeout: TIMEOUTS.MODAL, visible: true })
        .then(() => 'error' as const)
        .catch(() => null);
    const loginErrorText = page
        .waitForFunction(
            () => {
                const text = document.body?.innerText || '';
                // Inline twin of loginErrorTextMatches — page.evaluate cannot close over imports.
                // Reload toast wins over bare «Ошибка» (toast text contains «ошибка»).
                if (/Произошла ошибка\.?\s*Попробуйте перезагрузить/i.test(text)) {
                    return false;
                }
                if (/Ошибка/i.test(text) && /Введите пароль|Войти с паролем/i.test(text)) {
                    return true;
                }
                return /Неправильные данные для входа|неверн(ый|ые|ая)\s+(пароль|логин|данные)/i.test(text);
            },
            { timeout: TIMEOUTS.LONG },
        )
        .then(() => 'error' as const)
        .catch(() => null);
    const loginTransient = page
        .waitForFunction(() => /Произошла ошибка\.?\s*Попробуйте перезагрузить/i.test(document.body?.innerText || ''), {
            timeout: TIMEOUTS.LONG,
        })
        .then(() => 'transient' as const)
        .catch(() => null);
    const captcha = page
        .waitForSelector(SELECTORS.CAPTCHA_IMAGE, { timeout: TIMEOUTS.MODAL, visible: true })
        .then(() => 'captcha' as const)
        .catch(() => null);
    const otp = page
        .waitForSelector(SELECTORS.OTP_CODE_INPUT, { timeout: TIMEOUTS.MODAL, visible: true })
        .then(() => 'otp' as const)
        .catch(() => null);

    let outcome = await Promise.race([leftLogin, loginError, loginErrorText, loginTransient, captcha, otp]);

    if (!outcome) {
        const body = await readBodyText(page);
        if (loginTransientReloadMatches(body)) outcome = 'transient';
        else if (await pageHasBadCredentials(page)) outcome = 'error';
        else if (await page.$(SELECTORS.CAPTCHA_IMAGE)) outcome = 'captcha';
        else if (await page.$(SELECTORS.OTP_CODE_INPUT)) outcome = 'otp';
    }

    if (outcome === 'ok') {
        console.log('HH login completed (left /account/login)');
        return;
    }

    if (outcome === 'error' || outcome === 'transient') {
        // Re-read: toast + field «Ошибка» often race; prefer Magritte transient when toast is present.
        const body = await readBodyText(page);
        if (!afterTransientRetry && loginTransientReloadMatches(body)) {
            broadcast.broadcast('ERROR Magritte reload toast — retry login once');
            throw new MagritteLoginTransientError();
        }
        await throwCredentialOrTransient(page, browser, broadcast, afterTransientRetry);
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
        const body = await readBodyText(page);
        if (loginTransientReloadMatches(body) || (await pageHasBadCredentials(page))) {
            await throwCredentialOrTransient(page, browser, broadcast, afterTransientRetry);
        }
        if (await page.$(SELECTORS.CAPTCHA_IMAGE)) {
            await handleCaptchaGate(page, browser, broadcast, jobId);
            return;
        }
        throw new Error('HH login did not complete (still on login form)');
    }

    console.log('HH login submitted (no CAPTCHA / login error gate hit)');
}
