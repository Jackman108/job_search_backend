import { SELECTORS, TIMEOUTS } from '@config';
import { stop } from '@utils';
import { Browser, Page } from 'puppeteer';
import type { JobBroadcast } from '../job/broadcast.types.js';
import { clickFirstSelector, waitForFirstSelector } from './helpers/waitForFirstSelector.js';

const HH_LOGIN_URL = 'https://hh.ru/account/login';

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

    // Already past account-type (email field or credential pills).
    if ((await page.$(SELECTORS.EMAIL_INPUT)) || (await page.$(SELECTORS.EMAIL_BUTTON))) return;

    await applicantCard.click();
    await settle(400);

    const submit = await requireVisible(page, SELECTORS.LOGIN_SUBMIT, 'account-type SUBMIT');
    await submit.click();
    await settle();
}

/**
 * Search/serp may expose a header LOGIN; Magritte authorize lives on /account/login.
 * Prefer Magritte form if present; else CTA; else direct navigation.
 */
async function ensureLoginForm(page: Page): Promise<void> {
    if (await page.$(SELECTORS.ACCOUNT_LOGIN_FORM)) return;

    const loginMatch = await waitForFirstSelector(page, [SELECTORS.LOGIN], {
        timeout: TIMEOUTS.SEARCH,
        visible: true,
    });

    if (loginMatch) {
        await loginMatch.handle.click();
        const region = await page
            .waitForSelector(SELECTORS.REGION_BUTTON, { timeout: TIMEOUTS.SHORT })
            .catch(() => null);
        if (region) {
            await region.click();
            await settle();
            const again = await waitForFirstSelector(page, [SELECTORS.LOGIN], {
                timeout: TIMEOUTS.SEARCH,
                visible: true,
            });
            if (again) await again.handle.click();
        }
        await settle();
        if (await page.$(SELECTORS.ACCOUNT_LOGIN_FORM)) return;
    }

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

    // Magritte defaults to phone — switch to email before typing.
    const emailType = await clickFirstSelector(page, [SELECTORS.EMAIL_BUTTON], {
        timeout: TIMEOUTS.SEARCH,
        visible: true,
    });
    if (!emailType) {
        const inputPeek = await page.$(SELECTORS.EMAIL_INPUT);
        if (!inputPeek) {
            throw new Error('HH login: credential-type-email control not found');
        }
    }
    await settle();
}

async function fillEmailAndPassword(page: Page, email: string, password: string): Promise<void> {
    const emailHandle = await requireVisible(page, SELECTORS.EMAIL_INPUT, 'email input');
    await emailHandle.click({ clickCount: 3 }).catch(() => undefined);
    await emailHandle.type(email);

    // «Войти с паролем» swaps to password-only screen (email field disappears).
    const expanded = await clickFirstSelector(page, [SELECTORS.PASSWORD_BUTTON], {
        timeout: TIMEOUTS.SEARCH,
        visible: true,
    });
    if (!expanded) {
        throw new Error('HH login: expand-login-by-password not found');
    }
    await settle();

    const passwordHandle = await requireVisible(
        page,
        SELECTORS.PASSWORD_INPUT,
        'password input',
        TIMEOUTS.MODAL,
    );
    await passwordHandle.click({ clickCount: 3 }).catch(() => undefined);
    await passwordHandle.type(password);
}

async function submitAndDetectBlockers(page: Page, browser: Browser, broadcast: JobBroadcast): Promise<void> {
    const submit = await requireVisible(page, SELECTORS.LOGIN_SUBMIT, 'login submit');
    await submit.click();
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

    // Timed out still on login — fail loud instead of applying logged-out.
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
