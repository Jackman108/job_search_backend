import { SELECTORS, TIMEOUTS } from '@config';
import { Browser, Page } from 'puppeteer';
import type { JobBroadcast } from '../job/broadcast.types.js';
import { clickByExactText } from './helpers/clickByExactText.js';
import { dismissPreLoginOverlays } from './helpers/dismissPreLoginOverlays.js';
import { fillControlledInput } from './helpers/fillControlledInput.js';
import { MagritteLoginTransientError, submitAndDetectBlockers } from './helpers/loginBlockers.js';
import { stage } from './helpers/stageLog.js';
import { clickFirstSelector } from './helpers/waitForFirstSelector.js';
import { waitLoginCredentialStep, waitMagritteLoaderGone } from './helpers/waitMagritteReady.js';

const HH_LOGIN_URL = 'https://hh.ru/account/login';

/** Magritte RU labels (2026) — exact text; never English «LOGIN». */
const LABEL = {
    EMAIL_TAB: 'Почта',
    NEXT: 'Дальше',
    ENTER: 'Войти',
    LOGIN_WITH_PASSWORD: 'Войти с паролем',
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

    await waitMagritteLoaderGone(page);
    await applicantCard.click();
    await settle(400);
    await waitMagritteLoaderGone(page);

    const submit =
        (await clickFirstSelector(page, [SELECTORS.LOGIN_SUBMIT], {
            timeout: TIMEOUTS.SEARCH,
            visible: true,
        })) ||
        (await clickByExactText(page, LABEL.ENTER, { timeout: TIMEOUTS.SHORT })) ||
        (await clickByExactText(page, LABEL.NEXT, { timeout: TIMEOUTS.SHORT }));
    if (!submit) {
        throw new Error('HH login: account-type SUBMIT not found');
    }
    await waitMagritteLoaderGone(page, TIMEOUTS.LONG);
    const ready = await waitLoginCredentialStep(page, TIMEOUTS.MODAL);
    if (!ready) {
        await page.screenshot({ path: 'screenshot-authorize-account-type.png' }).catch(() => null);
        throw new Error('HH login: credential step did not appear after account-type submit');
    }
}

/** Always Magritte /account/login — do not wait for serp English/header LOGIN. */
async function ensureLoginForm(page: Page): Promise<void> {
    if (await page.$(SELECTORS.ACCOUNT_LOGIN_FORM)) {
        await dismissPreLoginOverlays(page);
        return;
    }

    await page.goto(HH_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });
    await settle(TIMEOUTS.SHORT * 2);
    await dismissPreLoginOverlays(page);

    const form = await page
        .waitForSelector(SELECTORS.ACCOUNT_LOGIN_FORM, { timeout: TIMEOUTS.MODAL, visible: true })
        .catch(() => null);
    if (!form) {
        throw new Error('HH login: account-login-form not found after navigation');
    }
}

async function pageLoginBody(page: Page): Promise<string> {
    return page.evaluate(() => document.body?.innerText || '').catch(() => '');
}

/** Magritte may reopen password for a phone profile — back out and pick Почта. */
async function leavePhonePasswordStep(page: Page): Promise<boolean> {
    const body = await pageLoginBody(page);
    if (!/От профиля с номером/i.test(body)) return false;

    stage('login', 'phone password step — back to pick email');
    const back =
        (await clickFirstSelector(page, ['[data-qa="go-back-button"]'], {
            timeout: TIMEOUTS.SEARCH,
            visible: true,
        })) || (await clickByExactText(page, 'Назад', { timeout: TIMEOUTS.SHORT }));
    if (!back) {
        await page.screenshot({ path: 'screenshot-authorize-phone-stuck.png' }).catch(() => null);
        throw new Error('HH login: phone profile password step and go-back not found');
    }
    await settle();
    await waitMagritteLoaderGone(page);
    return true;
}

async function chooseEmailCredential(page: Page): Promise<void> {
    if (await leavePhonePasswordStep(page)) {
        // fall through to email tab / input
    } else if (await page.$(SELECTORS.EMAIL_INPUT)) {
        return;
    } else {
        const body = await pageLoginBody(page);
        // Password for the email we want — OK to skip tab.
        if (
            /От профиля с почтой/i.test(body) &&
            ((await page.$(SELECTORS.PASSWORD_INPUT)) || (await page.$(SELECTORS.PASSWORD_BUTTON)))
        ) {
            return;
        }
        // Unknown password-only — still try email tab after back if possible.
        if ((await page.$(SELECTORS.PASSWORD_INPUT)) || (await page.$(SELECTORS.PASSWORD_BUTTON))) {
            if (!/От профиля с почтой/i.test(body)) {
                await leavePhonePasswordStep(page);
            } else {
                return;
            }
        }
    }

    if (await page.$(SELECTORS.EMAIL_INPUT)) return;

    const emailType = await clickFirstSelector(page, [SELECTORS.EMAIL_BUTTON], {
        timeout: TIMEOUTS.MODAL,
        visible: true,
    });
    if (!emailType) {
        const byText = await clickByExactText(page, LABEL.EMAIL_TAB, { timeout: TIMEOUTS.SEARCH });
        if (!byText && !(await page.$(SELECTORS.EMAIL_INPUT))) {
            await page.screenshot({ path: 'screenshot-authorize-email-tab.png' }).catch(() => null);
            throw new Error('HH login: credential-type-email / Почта control not found');
        }
    }
    await settle();
    await waitMagritteLoaderGone(page);
}
async function openPasswordStep(page: Page): Promise<void> {
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
    const emailReady = await page.$(SELECTORS.EMAIL_INPUT);
    if (emailReady) {
        const emailHandle = await requireVisible(page, SELECTORS.EMAIL_INPUT, 'email input');
        await fillControlledInput(page, emailHandle, email);
        await openPasswordStep(page);
    } else if (await page.$(SELECTORS.PASSWORD_BUTTON)) {
        await openPasswordStep(page);
    } else if (!(await page.$(SELECTORS.PASSWORD_INPUT))) {
        throw new Error('HH login: neither email nor password input after credential step');
    }

    const passwordHandle = await requireVisible(page, SELECTORS.PASSWORD_INPUT, 'password input', TIMEOUTS.MODAL);
    await fillControlledInput(page, passwordHandle, password);
}

async function runLoginPass(
    page: Page,
    email: string,
    password: string,
    browser: Browser,
    broadcast: JobBroadcast,
    jobId: string,
    afterTransientRetry: boolean,
): Promise<void> {
    await ensureLoginForm(page);
    await passAccountTypeGate(page);
    await chooseEmailCredential(page);
    await fillEmailAndPassword(page, email, password);
    await submitAndDetectBlockers(page, browser, broadcast, jobId, { afterTransientRetry });
}

export async function authorize(
    page: Page,
    email: string,
    password: string,
    browser: Browser,
    broadcast: JobBroadcast,
    jobId: string,
): Promise<void> {
    try {
        await runLoginPass(page, email, password, browser, broadcast, jobId, false);
    } catch (error) {
        if (error instanceof MagritteLoginTransientError) {
            stage('login', 'Magritte reload toast — full login retry once');
            await page
                .goto(HH_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG })
                .catch(() => undefined);
            await settle(TIMEOUTS.SHORT * 2);
            try {
                await runLoginPass(page, email, password, browser, broadcast, jobId, true);
                return;
            } catch (retryError) {
                console.error('Error during authorization (after Magritte reload retry):', retryError);
                await page.screenshot({ path: 'screenshot-authorize-fail.png' }).catch(() => null);
                throw retryError;
            }
        }
        console.error('Error during authorization:', error);
        await page.screenshot({ path: 'screenshot-authorize-fail.png' }).catch(() => null);
        throw error;
    }
}
