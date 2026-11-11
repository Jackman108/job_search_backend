import { SELECTORS, TIMEOUTS } from '@config';
import { stop } from '@utils';
import { Browser, Page } from 'puppeteer';
import type { JobBroadcast } from '../job/broadcast.types.js';
import { clickByExactText } from './helpers/clickByExactText.js';
import { clickFirstSelector } from './helpers/waitForFirstSelector.js';

const HH_LOGIN_URL = 'https://hh.ru/account/login';

/** Magritte RU labels (2026) — exact text; never English «LOGIN». */
const LABEL = {
    EMAIL_TAB: 'Почта',
    NEXT: 'Дальше',
    LOGIN_WITH_PASSWORD: 'Войти с паролем',
    SUBMIT: 'Войти',
} as const;

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requireVisible(
    page: Page,
    selector: string,
    label: string,
    timeout = TIMEOUTS.SEARCH,
): Promise<NonNullable<Awaited<ReturnType<Page['waitForSelector']>>>> {
    const handle = await page.waitForSelector(selector, { timeout, visible: true }).catch(() => null);
    if (!handle) {
        throw new Error(`HH login: ${label} not found (${selector})`);
    }
    return handle;
}

/** Magritte: applicant vs employer, then submit to credential screen. */
async function passAccountTypeGate(page: Page): Promise<void> {
    const form = await page.$(SELECTORS.ACCOUNT_LOGIN_FORM);
    const applicantCard = await page.$(SELECTORS.ACCOUNT_TYPE_APPLICANT);
    if (!form || !applicantCard) return;

    if ((await page.$(SELECTORS.EMAIL_INPUT)) || (await page.$(SELECTORS.EMAIL_BUTTON))) return;

    await applicantCard.click();
    await settle(400);

    const submit =
        (await clickFirstSelector(page, [SELECTORS.LOGIN_SUBMIT], {
            timeout: TIMEOUTS.SEARCH,
            visible: true,
        })) || (await clickByExactText(page, LABEL.NEXT, { timeout: TIMEOUTS.SHORT }));
    if (!submit) {
        throw new Error('HH login: account-type SUBMIT not found');
    }
    await settle();
}

/** Always Magritte /account/login — do not wait for serp English/header LOGIN. */
async function ensureLoginForm(page: Page): Promise<void> {
    if (await page.$(SELECTORS.ACCOUNT_LOGIN_FORM)) return;

    await page.goto(HH_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });
    await settle(TIMEOUTS.SHORT * 2);

    const form = await page
        .waitForSelector(SELECTORS.ACCOUNT_LOGIN_FORM, { timeout: TIMEOUTS.MODAL, visible: true })
        .catch(() => null);
    if (!form) {
        throw new Error('HH login: account-login-form not found after navigation');
    }
}

async function chooseEmailCredential(page: Page): Promise<void> {
    if (await page.$(SELECTORS.EMAIL_INPUT)) return;

    const emailType = await clickFirstSelector(page, [SELECTORS.EMAIL_BUTTON], {
        timeout: TIMEOUTS.SEARCH,
        visible: true,
    });
    if (!emailType) {
        const byText = await clickByExactText(page, LABEL.EMAIL_TAB, { timeout: TIMEOUTS.SHORT });
        if (!byText && !(await page.$(SELECTORS.EMAIL_INPUT))) {
            throw new Error('HH login: credential-type-email / Почта control not found');
        }
    }
    await settle();
}

async function openPasswordStep(page: Page): Promise<void> {
    // Prefer «Войти с паролем» (password screen). Fallback: «Дальше» then password if present.
    const byQa = await clickFirstSelector(page, [SELECTORS.PASSWORD_BUTTON], {
        timeout: TIMEOUTS.SEARCH,
        visible: true,
    });
    if (byQa) {
        await settle();
        return;
    }

    const byPasswordText = await clickByExactText(page, LABEL.LOGIN_WITH_PASSWORD, {
        timeout: TIMEOUTS.SHORT,
    });
    if (byPasswordText) {
        await settle();
        return;
    }

    const byNext = await clickByExactText(page, LABEL.NEXT, { timeout: TIMEOUTS.SHORT });
    if (byNext) {
        await settle();
        if (await page.$(SELECTORS.PASSWORD_INPUT)) return;
        const again = await clickByExactText(page, LABEL.LOGIN_WITH_PASSWORD, {
            timeout: TIMEOUTS.SHORT,
        });
        if (again) {
            await settle();
            return;
        }
    }

    throw new Error('HH login: Войти с паролем / expand-login-by-password not found');
}

async function fillEmailAndPassword(page: Page, email: string, password: string): Promise<void> {
    const emailHandle = await requireVisible(page, SELECTORS.EMAIL_INPUT, 'email input');
    await emailHandle.click({ clickCount: 3 }).catch(() => undefined);
    await emailHandle.type(email);

    await openPasswordStep(page);

    const passwordHandle = await requireVisible(page, SELECTORS.PASSWORD_INPUT, 'password input', TIMEOUTS.MODAL);
    await passwordHandle.click({ clickCount: 3 }).catch(() => undefined);
    await passwordHandle.type(password);
}

async function clickLoginSubmit(page: Page): Promise<void> {
    const byQa = await clickFirstSelector(page, [SELECTORS.LOGIN_SUBMIT], {
        timeout: TIMEOUTS.SEARCH,
        visible: true,
    });
    if (byQa) return;

    const byText = await clickByExactText(page, LABEL.SUBMIT, { timeout: TIMEOUTS.SEARCH });
    if (!byText) {
        throw new Error('HH login: login submit / Войти not found');
    }
}

async function submitAndDetectBlockers(page: Page, browser: Browser, broadcast: JobBroadcast): Promise<void> {
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
    const captcha = page
        .waitForSelector(SELECTORS.CAPTCHA_IMAGE, { timeout: TIMEOUTS.MODAL, visible: true })
        .then(() => 'captcha' as const)
        .catch(() => null);
    const otp = page
        .waitForSelector(SELECTORS.OTP_CODE_INPUT, { timeout: TIMEOUTS.MODAL, visible: true })
        .then(() => 'otp' as const)
        .catch(() => null);

    const outcome = await Promise.race([leftLogin, loginError, captcha, otp]);

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
        const captchaHandle = await page.$(SELECTORS.CAPTCHA_IMAGE);
        const captchaSrc = captchaHandle
            ? await page.evaluate((img) => (img as HTMLImageElement).src, captchaHandle).catch(() => '')
            : '';
        broadcast.broadcast(`CAPTCHA detected restart ${captchaSrc}`);
        await page.screenshot({ path: 'screenshot-CAPTCHA.png' }).catch(() => null);
        await stop(browser);
        throw new Error(`CAPTCHA detected restart ${captchaSrc || ''}`.trim());
    }

    const stillPassword = await page.$(SELECTORS.PASSWORD_INPUT);
    const stillForm = await page.$(SELECTORS.ACCOUNT_LOGIN_FORM);
    if (stillForm && stillPassword) {
        await page.screenshot({ path: 'screenshot-authorize-stuck.png' }).catch(() => null);
        throw new Error('HH login did not complete (still on login form)');
    }

    console.log('HH login submitted (no CAPTCHA / login error gate hit)');
}

export async function authorize(
    page: Page,
    email: string,
    password: string,
    browser: Browser,
    broadcast: JobBroadcast,
): Promise<void> {
    try {
        await ensureLoginForm(page);
        await passAccountTypeGate(page);
        await chooseEmailCredential(page);
        await fillEmailAndPassword(page, email, password);
        await submitAndDetectBlockers(page, browser, broadcast);
    } catch (error) {
        console.error('Error during authorization:', error);
        throw error;
    }
}
