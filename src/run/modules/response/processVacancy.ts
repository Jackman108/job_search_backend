import { SELECTORS, TIMEOUTS, VACANCY_STATUS } from '@config';
import { ProcessVacancyParams } from '@interface';
import { saveVacancy } from '@services';
import { broadcast } from '@server';
import { scrollToElementIfNotFound } from '../../helpers/scrollToElementIfNotFound.js';
import { detectApplyOutcome, detectEarlyPreflight, isSubmitDisabled } from './detectApplyState.js';
import { dismissApplyExtras } from './dismissApplyExtras.js';
import { fillNativeValue } from './fillNativeValue.js';
import { submitApplyResponse } from './submitApplyResponse.js';

export type ProcessVacancyResult = 'success' | 'fail' | 'skip' | 'captcha';

async function settle(ms = TIMEOUTS.SHORT): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

async function saveSkip(
    data: ProcessVacancyParams['data'],
    userId: string,
    counters: ProcessVacancyParams['counters'],
    reason: string,
): Promise<void> {
    counters.unsuccessfullySubmittedCount++;
    data.vacancy_status = VACANCY_STATUS.SKIP;
    await saveVacancy(data, userId);
    console.log(`Vacancy ${data.id} skipped (${reason}) → status ${VACANCY_STATUS.SKIP} · ${data.title_vacancy}`);
}

async function saveFail(
    data: ProcessVacancyParams['data'],
    userId: string,
    counters: ProcessVacancyParams['counters'],
    reason: string,
): Promise<void> {
    counters.unsuccessfullySubmittedCount++;
    data.vacancy_status = VACANCY_STATUS.SKIP;
    await saveVacancy(data, userId);
    console.log(`Vacancy ${data.id} failed (${reason}) → status ${VACANCY_STATUS.SKIP} · ${data.title_vacancy}`);
}

async function saveSuccess(
    data: ProcessVacancyParams['data'],
    userId: string,
    counters: ProcessVacancyParams['counters'],
): Promise<void> {
    counters.successfullySubmittedCount++;
    data.vacancy_status = VACANCY_STATUS.SUCCESS;
    await saveVacancy(data, userId);
    console.log(`Vacancy ${data.id} saved as success · ${data.title_vacancy}`);
}

export async function processVacancy({
    page,
    vacancyResponse,
    data,
    counters,
    message,
    userId,
}: ProcessVacancyParams): Promise<ProcessVacancyResult> {
    try {
        await settle();
        await vacancyResponse.click();

        const relocationModal = await page
            .waitForSelector(SELECTORS.RELOCATION_MODAL_TITLE, {
                timeout: TIMEOUTS.MODAL,
            })
            .catch(() => null);

        if (relocationModal) {
            const modalText = await page.evaluate((el) => el.textContent, relocationModal);
            if (modalText?.includes('Вы откликаетесь на вакансию в другой стране')) {
                await page.click(SELECTORS.RELOCATION_CONFIRM);
            }
        }

        // Optional vacancy-page top CTA when popup submit is not yet mounted.
        await page.evaluate((selectors) => {
            const hasPopup = document.querySelector(selectors.RESPONSE_SUBMIT);
            const top = document.querySelector(selectors.RESPONSE_LINK_TOP) as HTMLElement | null;
            if (top && !hasPopup) top.click();
        }, SELECTORS);
        await settle();

        const early = await detectEarlyPreflight(page);
        if (early === 'already') {
            await saveSuccess(data, userId, counters);
            await dismissApplyExtras(page);
            return 'success';
        }
        if (early === 'hidden_resume' || early === 'employer_questions') {
            await dismissApplyExtras(page);
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => null);
            await saveSkip(data, userId, counters, early);
            return 'skip';
        }

        const coverToggle = await scrollToElementIfNotFound(page, SELECTORS.COVER_LETTER_TOGGLE);
        if (coverToggle) await coverToggle.click();

        await page.waitForSelector(SELECTORS.COVER_LETTER_INPUT, { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        const coverFilled = await fillNativeValue(page, SELECTORS.COVER_LETTER_INPUT, message);
        if (!coverFilled) {
            console.warn(`Cover letter input not filled for vacancy ${data.id}`);
        }

        if (await isSubmitDisabled(page)) {
            await dismissApplyExtras(page);
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => null);
            await saveSkip(data, userId, counters, 'disabled_submit');
            return 'skip';
        }

        const submitted = await submitApplyResponse(page);
        if (!submitted) {
            await dismissApplyExtras(page);
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => null);
            await saveFail(data, userId, counters, 'no_submit_control');
            return 'fail';
        }

        await settle(TIMEOUTS.SHORT * 2);
        await dismissApplyExtras(page);
        await settle();

        const outcome = await detectApplyOutcome(page);
        if (outcome.captcha) {
            broadcast('CAPTCHA detected mid-apply — aborting HH run');
            await page.screenshot({ path: 'screenshot-CAPTCHA-apply.png' }).catch(() => null);
            await saveFail(data, userId, counters, 'captcha');
            return 'captcha';
        }

        if (outcome.success) {
            await saveSuccess(data, userId, counters);
            return 'success';
        }

        // Secondary: invalid Bloko/Magritte field CSS — never mark true without body success.
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => null);
        await saveFail(data, userId, counters, outcome.formInvalid ? 'form_invalid' : 'no_success_marker');
        return 'fail';
    } catch (error) {
        await page.screenshot({ path: 'screenshot-during.png' }).catch(() => null);
        console.error('An error during the processing of a vacancy:', error);
        return 'fail';
    }
}
