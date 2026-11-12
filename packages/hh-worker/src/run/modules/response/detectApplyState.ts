import { createRequire } from 'node:module';
import { Page } from 'puppeteer';
import { APPLY_SUCCESS_RE, SELECTORS } from '@config';

export type ApplyPreflightReason = 'already' | 'hidden_resume' | 'employer_questions' | 'disabled_submit' | null;

export type ApplyDetectResult = {
    success: boolean;
    captcha: boolean;
    formInvalid: boolean;
};

const require = createRequire(import.meta.url);
const detectEarlyPreflightInPage = require('./detectEarlyPreflight.browser.js') as (
    selectors: typeof SELECTORS,
    successReSource: string,
) => ApplyPreflightReason;

/** Primary success signal used by live Magritte applies. */
export function isApplySuccessText(bodyText: string): boolean {
    return APPLY_SUCCESS_RE.test(bodyText);
}

export function isCaptchaText(text: string): boolean {
    return /капч/i.test(text);
}

/** Early gates before cover fill — do not treat empty letter as a skip. */
export async function detectEarlyPreflight(page: Page): Promise<ApplyPreflightReason> {
    return page.evaluate(detectEarlyPreflightInPage, SELECTORS, APPLY_SUCCESS_RE.source);
}

export async function isSubmitDisabled(page: Page): Promise<boolean> {
    return page.evaluate((selectors) => {
        const submitSel = [
            selectors.RESPONSE_LINK_NO_QUESTIONS,
            ...selectors.RESPONSE_SUBMIT.split(',').map((s: string) => s.trim()),
        ].join(', ');
        const submit = document.querySelector(submitSel) as HTMLButtonElement | HTMLAnchorElement | null;
        if (!submit) return false;
        return (
            submit.hasAttribute('disabled') ||
            submit.getAttribute('aria-disabled') === 'true' ||
            submit.classList.contains('disabled')
        );
    }, SELECTORS);
}

export async function detectApplyOutcome(page: Page): Promise<ApplyDetectResult> {
    return page.evaluate(
        (selectors, successReSource) => {
            const body = document.body?.innerText || '';
            const dialog = (document.querySelector('[role=dialog]') as HTMLElement | null)?.innerText || '';
            const captchaImg = !!document.querySelector(selectors.CAPTCHA_IMAGE);
            const captcha = captchaImg || /капч/i.test(dialog) || /капч/i.test(body);

            const formInvalid = [
                document.querySelector(selectors.BLOK_TEXTAREA)?.classList.contains(selectors.TEXTAREA_INVALID),
                document.querySelector(selectors.BLOK_RADIO)?.classList.contains(selectors.RADIO_INVALID),
                document.querySelector(selectors.BLOCK_CHECKBOX)?.classList.contains(selectors.BLOCK_CHECKBOX_INVALID),
            ].some(Boolean);

            return {
                success: new RegExp(successReSource).test(body),
                captcha,
                formInvalid: !!formInvalid,
            };
        },
        SELECTORS,
        APPLY_SUCCESS_RE.source,
    );
}
