import { SELECTORS, TIMEOUTS } from '@config';
import { Browser, Page } from 'puppeteer';
import type { JobBroadcast } from '../job/broadcast.types.js';
import { clickByExactText } from './helpers/clickByExactText.js';
import { dismissPreLoginOverlays } from './helpers/dismissPreLoginOverlays.js';
import { fillControlledInput } from './helpers/fillControlledInput.js';
import { submitAndDetectBlockers } from './helpers/loginBlockers.js';
import { clickFirstSelector } from './helpers/waitForFirstSelector.js';

const HH_LOGIN_URL = 'https://hh.ru/account/login';

/** Magritte RU labels (2026) — exact text; never English «LOGIN». */
const LABEL = {
    EMAIL_TAB: 'Почта',
    NEXT: 'Дальше',
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
    await fillControlledInput(page, emailHandle, email);

    await openPasswordStep(page);

    const passwordHandle = await requireVisible(page, SELECTORS.PASSWORD_INPUT, 'password input', TIMEOUTS.MODAL);
    await fillControlledInput(page, passwordHandle, password);
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
        await ensureLoginForm(page);
        await passAccountTypeGate(page);
        await chooseEmailCredential(page);
        await fillEmailAndPassword(page, email, password);
        await submitAndDetectBlockers(page, browser, broadcast, jobId);
    } catch (error) {
        console.error('Error during authorization:', error);
        throw error;
    }
}
