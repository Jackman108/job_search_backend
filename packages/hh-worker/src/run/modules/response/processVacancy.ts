import { SELECTORS, TIMEOUTS, VACANCY_STATUS } from '@config';
import { ProcessVacancyParams } from '@interface';
import type { VacancyRepo } from '../../../job/vacancyRepo.types.js';
import { scrollToElementIfNotFound } from '../../helpers/scrollToElementIfNotFound.js';
import { stage } from '../../helpers/stageLog.js';
import { readCaptchaSrc, waitAndSubmitCaptchaAnswer } from '../../helpers/waitForCaptchaAnswer.js';
import { clickVacancyApply } from './clickVacancyApply.js';
import { clickVacancyPageApply } from './clickVacancyPageApply.js';
import { detectApplyOutcome, detectEarlyPreflight, isSubmitDisabled } from './detectApplyState.js';
import { dismissApplyExtras } from './dismissApplyExtras.js';
import { ensureSerpReady } from './ensureSerpReady.js';
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
    vacancyRepo: VacancyRepo,
    reason: string,
): Promise<void> {
    counters.skippedCount++;
    data.vacancy_status = VACANCY_STATUS.SKIP;
    await vacancyRepo.saveVacancy(data, userId);
    console.log(`Vacancy ${data.id} skipped (${reason}) → status ${VACANCY_STATUS.SKIP} · ${data.title_vacancy}`);
}

async function saveFail(
    data: ProcessVacancyParams['data'],
    userId: string,
    counters: ProcessVacancyParams['counters'],
    vacancyRepo: VacancyRepo,
    reason: string,
): Promise<void> {
    counters.failedCount++;
    data.vacancy_status = VACANCY_STATUS.SKIP;
    await vacancyRepo.saveVacancy(data, userId);
    console.log(`Vacancy ${data.id} failed (${reason}) → status ${VACANCY_STATUS.SKIP} · ${data.title_vacancy}`);
}

async function saveSuccess(
    data: ProcessVacancyParams['data'],
    userId: string,
    counters: ProcessVacancyParams['counters'],
    vacancyRepo: VacancyRepo,
): Promise<void> {
    counters.successfullySubmittedCount++;
    data.vacancy_status = VACANCY_STATUS.SUCCESS;
    await vacancyRepo.saveVacancy(data, userId);
    console.log(`Vacancy ${data.id} saved as success · ${data.title_vacancy}`);
}

async function leaveApplySurface(page: ProcessVacancyParams['page'], serpUrl?: string): Promise<void> {
    await dismissApplyExtras(page);
    await settle();
    await ensureSerpReady(page, serpUrl);
}

export async function processVacancy({
    page,
    data,
    counters,
    message,
    userId,
    vacancyRepo,
    broadcast,
    jobId,
    serpUrl,
}: ProcessVacancyParams): Promise<ProcessVacancyResult> {
    try {
        stage('vacancy', `${data.id} ${data.title_vacancy ?? ''}`.trim());
        await ensureSerpReady(page, serpUrl);

        let opened = await clickVacancyApply(page, data.id);
        if (!opened && data.url_vacancy) {
            stage('apply fallback', `vacancy page · ${data.id}`);
            opened = await clickVacancyPageApply(page, data.url_vacancy);
        }
        if (!opened) {
            await saveFail(data, userId, counters, vacancyRepo, 'apply_control_missing');
            await ensureSerpReady(page, serpUrl);
            return 'fail';
        }

        const relocationModal = await page
            .waitForSelector(SELECTORS.RELOCATION_MODAL_TITLE, { timeout: TIMEOUTS.MODAL })
            .catch(() => null);

        if (relocationModal) {
            const modalText = await page.evaluate((el) => el.textContent, relocationModal);
            if (modalText?.includes('Вы откликаетесь на вакансию в другой стране')) {
                await page.click(SELECTORS.RELOCATION_CONFIRM).catch(() => undefined);
            }
        }

        await page.evaluate((selectors) => {
            const hasPopup = document.querySelector(selectors.RESPONSE_SUBMIT);
            const top = document.querySelector(selectors.RESPONSE_LINK_TOP) as HTMLElement | null;
            if (top && !hasPopup) top.click();
        }, SELECTORS);
        await settle();

        const early = await detectEarlyPreflight(page);
        if (early === 'already') {
            await saveSuccess(data, userId, counters, vacancyRepo);
            await leaveApplySurface(page, serpUrl);
            return 'success';
        }
        if (early === 'hidden_resume' || early === 'employer_questions') {
            await leaveApplySurface(page, serpUrl);
            await saveSkip(data, userId, counters, vacancyRepo, early);
            return 'skip';
        }

        stage('cover letter', String(data.id));
        const coverToggle = await scrollToElementIfNotFound(page, SELECTORS.COVER_LETTER_TOGGLE);
        if (coverToggle) {
            await coverToggle.click().catch(() => undefined);
        }

        await page.waitForSelector(SELECTORS.COVER_LETTER_INPUT, { timeout: TIMEOUTS.SEARCH }).catch(() => null);
        const coverFilled = await fillNativeValue(page, SELECTORS.COVER_LETTER_INPUT, message);
        if (!coverFilled) {
            stage('cover letter skip', `no input · ${data.id}`);
        }

        if (await isSubmitDisabled(page)) {
            await leaveApplySurface(page, serpUrl);
            await saveSkip(data, userId, counters, vacancyRepo, 'disabled_submit');
            return 'skip';
        }

        stage('submit', String(data.id));
        const submitted = await submitApplyResponse(page);
        if (!submitted) {
            await leaveApplySurface(page, serpUrl);
            await saveFail(data, userId, counters, vacancyRepo, 'no_submit_control');
            return 'fail';
        }

        await settle(TIMEOUTS.SHORT * 2);
        await dismissApplyExtras(page);
        await settle();

        // Magritte toasts appear briefly — poll a few times before failing.
        let outcome = await detectApplyOutcome(page);
        for (let i = 0; i < 4 && !outcome.success && !outcome.captcha && !outcome.formInvalid; i++) {
            await settle(TIMEOUTS.SHORT);
            outcome = await detectApplyOutcome(page);
        }

        if (outcome.captcha) {
            broadcast.broadcast('CAPTCHA mid-apply — waiting for POST /jobs/:id/captcha');
            await page.screenshot({ path: 'screenshot-CAPTCHA-apply.png' }).catch(() => null);
            const src = await readCaptchaSrc(page);
            const solved = await waitAndSubmitCaptchaAnswer(jobId, page, src);
            if (!solved) {
                await saveFail(data, userId, counters, vacancyRepo, 'captcha');
                await leaveApplySurface(page, serpUrl).catch(() => undefined);
                return 'captcha';
            }
            await settle(TIMEOUTS.SHORT * 2);
            outcome = await detectApplyOutcome(page);
            if (outcome.captcha) {
                await saveFail(data, userId, counters, vacancyRepo, 'captcha_still');
                await leaveApplySurface(page, serpUrl).catch(() => undefined);
                return 'captcha';
            }
        }

        if (outcome.success) {
            await saveSuccess(data, userId, counters, vacancyRepo);
            await leaveApplySurface(page, serpUrl);
            return 'success';
        }

        const bodyHint = await page
            .evaluate(() => (document.body?.innerText || '').replace(/\s+/g, ' ').slice(0, 220))
            .catch(() => '');
        stage('outcome miss', bodyHint || 'empty body');
        await page.screenshot({ path: `screenshot-no-success-${data.id}.png` }).catch(() => null);

        await leaveApplySurface(page, serpUrl);
        await saveFail(data, userId, counters, vacancyRepo, outcome.formInvalid ? 'form_invalid' : 'no_success_marker');
        return 'fail';
    } catch (error) {
        await page.screenshot({ path: 'screenshot-during.png' }).catch(() => null);
        console.error('An error during the processing of a vacancy:', error);
        await leaveApplySurface(page, serpUrl).catch(() => undefined);
        await saveFail(data, userId, counters, vacancyRepo, 'exception').catch(() => undefined);
        return 'fail';
    }
}
