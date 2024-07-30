// src/searchForVacancy.js
import { SELECTORS, TIMEOUTS } from '../constants.js';

export async function searchForVacancy(page, position) {

    await new Promise(r => setTimeout(r, TIMEOUTS.SEARCH));

    try {
        const vacancyInputSelector = await page.waitForSelector(
            SELECTORS.VACANCY_INPUT,
            { timeout: TIMEOUTS.SEARCH });

        if (vacancyInputSelector) {
            await vacancyInputSelector.evaluate(input => input.value = '');
            await vacancyInputSelector.type(position);

            await page.keyboard.press('Enter');
            console.log('Job Search Form Submitted.');
        } else {
            console.error('No vacancy entry field was found.');
        }

    } catch (error) {
        console.error('Error when searching for a vacancy:', error);
    }
}


