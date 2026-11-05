// src/searchForVacancy.ts
import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

interface SearchForVacancyParams {
    page: Page;
    position: string;
}

export async function searchForVacancy({ page, position }: SearchForVacancyParams): Promise<void> {
    await new Promise(r => setTimeout(r, TIMEOUTS.SEARCH));

    try {
        const vacancyInputSelector = await page.waitForSelector(
            SELECTORS.VACANCY_INPUT,
            { timeout: TIMEOUTS.SEARCH });

        if (vacancyInputSelector) {
            await vacancyInputSelector.evaluate(input => {
                (input as HTMLInputElement).value = '';
            });

            await vacancyInputSelector.type(position);
            await page.keyboard.press('Enter');
        } else {
            console.error('No vacancy entry field was found.');
        }

    } catch (error) {
        console.error('Error when searching for a vacancy:', error);
    }
}


