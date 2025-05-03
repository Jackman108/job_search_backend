// src/processVacancy.js
import { SELECTORS, TIMEOUTS } from '../../../constants.js';
import { ProcessVacancyParams } from '../../../interface/index.js';
import { saveVacancy } from '../../../services/vacancyService.js';
import { scrollToElementIfNotFound } from "../../helpers/scrollToElementIfNotFound.js";

export async function processVacancy({
    page,
    vacancyResponse,
    data,
    counters,
    message,
    userId
}: ProcessVacancyParams): Promise<void> {
    try {
        await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
        await page.screenshot({ path: 'screenshot-uncknoun.png' });
        await vacancyResponse.click();

        const relocationModal = await page.waitForSelector(SELECTORS.RELOCATION_MODAL_TITLE, {
            timeout: TIMEOUTS.MODAL
        }).catch(() => null);

        if (relocationModal) {
            const modalText = await page.evaluate(el => el.textContent, relocationModal);
            if (modalText?.includes('Вы откликаетесь на вакансию в другой стране')) {
                await page.click(SELECTORS.RELOCATION_CONFIRM);
            }
        }

        const coverLetterButton = await scrollToElementIfNotFound(page, SELECTORS.COVER_LETTER_TOGGLE);
        if (coverLetterButton) await coverLetterButton.click();

        const coverLetterInput = await scrollToElementIfNotFound(page, SELECTORS.COVER_LETTER_INPUT);
        if (coverLetterInput) {
            await page.type(SELECTORS.COVER_LETTER_INPUT, message);
        }
        const responseSubmitButton = await scrollToElementIfNotFound(page, SELECTORS.RESPONSE_SUBMIT);
        if (responseSubmitButton) await responseSubmitButton.click();

        await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));

        const isInvalid = await page.evaluate((SELECTORS) => {
            return [
                document.querySelector(SELECTORS.BLOK_TEXTAREA)?.classList.contains(SELECTORS.TEXTAREA_INVALID),
                document.querySelector(SELECTORS.BLOK_RADIO)?.classList.contains(SELECTORS.RADIO_INVALID),
                document.querySelector(SELECTORS.BLOCK_CHECKBOX)?.classList.contains(SELECTORS.BLOCK_CHECKBOX_INVALID),
            ].some(Boolean);
        }, SELECTORS);

        if (isInvalid) {
            console.log('An error was detected in the response form');
            counters.unsuccessfullySubmittedCount++;
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });
            await saveVacancy(data, userId);
            console.log(`The vacancy with ID ${data.id} is saved with flag N for ${data.title_vacancy}`);
        } else {
            counters.successfullySubmittedCount++;
            data.vacancy_status = 'true';
            await saveVacancy(data, userId);
            console.log(`The vacancy with ID ${data.id} is saved with flag Y for ${data.title_vacancy}`);
        }
    } catch (error) {
        await page.screenshot({ path: 'screenshot-during.png' });
        console.error('An error during the processing of a vacancy:', error);
    }
}