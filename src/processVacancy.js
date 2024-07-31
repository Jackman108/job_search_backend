// src/processVacancy.js
import { SELECTORS, TIMEOUTS } from '../constants.js';
import { saveVacancy } from '../db.js';

export async function processVacancy(page, vacancyResponse, data, counters, message) {
    try {
        await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
        await vacancyResponse.click();

        const relocationModalSelector = SELECTORS.RELOCATION_MODAL_TITLE;
        const confirmButtonSelector = SELECTORS.RELOCATION_CONFIRM;

        const relocationModalHandle = await page.waitForSelector(
            relocationModalSelector,
            { timeout: TIMEOUTS.MODAL }).catch(() => null);

        if (relocationModalHandle) {
            const modalContent = await page.evaluate(titleModal => titleModal.textContent, relocationModalHandle);
            if (modalContent.includes('Вы откликаетесь на вакансию в другой стране')) {
                await page.click(confirmButtonSelector);
            }
        }

        const coverLetterToggleSelector = SELECTORS.COVER_LETTER_TOGGLE;
        const responseSubmitSelector = SELECTORS.RESPONSE_SUBMIT;
        const coverLetterInputSelector = SELECTORS.COVER_LETTER_INPUT;

        const coverLetterButtonHandle = await page.waitForSelector(
            coverLetterToggleSelector,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);

        if (coverLetterButtonHandle) {
            await coverLetterButtonHandle.click()
        }

        const coverLetterInputHandle = await page.waitForSelector(
            coverLetterInputSelector,
            { timeout: TIMEOUTS.SEARCH }).catch(() => null);

        if (coverLetterInputHandle) {
            await page.type(coverLetterInputSelector, message);
        } else {
            console.log('An error was detected in the cover letter');
            counters.unsuccessfullySubmittedCount++;
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });
        }

        const responseSubmitHandle = await page.waitForSelector(
            responseSubmitSelector,
            { timeout: TIMEOUTS.SEARCH }
        );
        if (responseSubmitHandle) {
            await responseSubmitHandle.click();
        }

        await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));

        const isInvalidTextareaVisible = await page.evaluate((SELECTORS) => {
            const textarea = document.querySelector(SELECTORS.BLOK_TEXTAREA);
            return textarea && textarea.classList.contains(SELECTORS.TEXTAREA_INVALID);
        }, SELECTORS);

        const isInvalidRadioVisible = await page.evaluate((SELECTORS) => {
            const radioLabel = document.querySelector(SELECTORS.BLOK_RADIO);
            return radioLabel && radioLabel.classList.contains(SELECTORS.RADIO_INVALID);
        }, SELECTORS);

        const isInvalidCheckboxVisible = await page.evaluate((SELECTORS) => {
            const radioLabel = document.querySelector(SELECTORS.BLOCK_CHECKBOX);
            return radioLabel && radioLabel.classList.contains(SELECTORS.BLOCK_CHECKBOX_INVALID);
        }, SELECTORS);

        if (isInvalidTextareaVisible || isInvalidRadioVisible || isInvalidCheckboxVisible) {
            console.log('An error was detected in the response form');
            counters.unsuccessfullySubmittedCount++;
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });

            await saveVacancy(data);
            console.log(`The vacancy with ID ${data.id} is saved with flag N`);
        } else {
            counters.successfullySubmittedCount++;
            data.vacancyStatus = true;
            await saveVacancy(data);
            console.log(`The vacancy with ID ${data.id} is saved with flag Y`);
        }
    } catch (error) {
        await page.screenshot({ path: 'screenshot-during.png' });

        console.error('An error during the processing of a vacancy:', error);
    }
};