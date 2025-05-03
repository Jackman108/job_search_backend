// src/getVacancies.ts
import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '../../../constants.js';
import { VacancyWithResponse } from '../../../interface/index.js';
import { extractVacancyData } from '../../../utils/vacancyUtils.js';

export async function getVacancies(page: Page): Promise<VacancyWithResponse[]> {
    try {
        await page.screenshot({ path: 'VACANCY_CARD.png' });

        await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG });
        const vacancies = await page.$$(SELECTORS.VACANCY_CARD);
        const vacanciesWithResponse: VacancyWithResponse[] = [];
        const visitedIds = new Set<number>();

        for (const vacancyHandle of vacancies) {
            const vacancyTitleHandle = await vacancyHandle.$(SELECTORS.VACANCY_TITLE);
            const vacancyLinkHandle = await vacancyHandle.$(SELECTORS.VACANCY_LINK);
            const vacancyResponseHandle = await vacancyHandle.$(SELECTORS.RESPONSE_BUTTON_SPAN);
            const companyLinkHandle = await vacancyHandle.$(SELECTORS.COMPANY_LINK);

            const title_vacancy = vacancyTitleHandle ? await page.evaluate(el => (el as HTMLAnchorElement).innerText.trim(), vacancyTitleHandle) : '';
            const url_vacancy = vacancyLinkHandle ? await page.evaluate(el => (el as HTMLAnchorElement).href, vacancyLinkHandle) : '';
            const responseText = vacancyResponseHandle ? await page.evaluate(el => el.textContent, vacancyResponseHandle) : '';

            let title_company = 'Компания не указана';
            let url_company = '#';

            if (companyLinkHandle) {
                title_company = await page.evaluate(el => (el as HTMLAnchorElement).textContent?.trim() ?? '', companyLinkHandle);
                url_company = await page.evaluate(el => (el as HTMLAnchorElement).href, companyLinkHandle);
            }

            if (responseText?.includes('Откликнуться')) {
                const data = await extractVacancyData({ title_vacancy, url_vacancy, title_company, url_company });

                if (!visitedIds.has(data.id)) {
                    visitedIds.add(data.id);
                    vacanciesWithResponse.push({ data, vacancyResponse: vacancyResponseHandle });
                }
            }
        }

        return vacanciesWithResponse;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error during job processing:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
}