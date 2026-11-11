// src/searchForVacancy.ts
import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';

interface SearchForVacancyParams {
    page: Page;
    position: string;
}

export async function searchForVacancy({ page, position }: SearchForVacancyParams): Promise<void> {
    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));

    try {
        const vacancyInputSelector = await page.waitForSelector(SELECTORS.VACANCY_INPUT, {
            timeout: TIMEOUTS.SEARCH,
            visible: true,
        });

        if (!vacancyInputSelector) {
            throw new Error('HH search input not found');
        }

        await vacancyInputSelector.click({ clickCount: 3 }).catch(() => undefined);
        await vacancyInputSelector.type(position);
        await page.keyboard.press('Enter');
    } catch (error) {
        console.error('Error when searching for a vacancy:', error);
        throw error;
    }
}
