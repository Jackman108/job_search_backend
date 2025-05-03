// src/navigateAndProcessVacancies.ts
import { SELECTORS, TIMEOUTS } from '../../../constants.js';
import { NavigateAndProcessVacanciesParams, VacancyWithResponse } from '../../../interface/index.js';
import { personalData } from '../../../secrets.js';
import { getVacanciesUser } from '../../../services/vacancyService.js';
import { isStopped, stop } from '../../../utils/stopManager.js';
import { getVacancies } from './getVacancies.js';
import { processVacancy } from './processVacancy.js';

export async function navigateAndProcessVacancies({
    userId,
    page,
    counters,
    message,
    browser
}: NavigateAndProcessVacanciesParams): Promise<void> {
    let currentPage = 0;
    let existingVacanciesIds: Set<number>;
    const { totalPages } = personalData;

    try {
        const vacanciesFromDb = await getVacanciesUser(userId);
        existingVacanciesIds = new Set(vacanciesFromDb.map(vacancy => vacancy.id));
    } catch (err) {
        console.error(`Error retrieving vacancies for user ${userId}: ${err}`);
        return;
    }

    while (currentPage < totalPages) {
        if (isStopped()) {
            await stop(browser);
            return;
        }
        try {
            console.log(`Processing page ${currentPage + 1} из ${totalPages}`);

            let vacancies: VacancyWithResponse[] = await getVacancies(page);
            vacancies = vacancies.filter(({ data }) => data.id && !existingVacanciesIds.has(data.id));
            if (vacancies.length === 0) {
                console.log('vacancies.length', vacancies.length);
                break;
            }

            for (let i = 0; i < vacancies.length; i++) {
                const { data, vacancyResponse } = vacancies[i];
                await page.screenshot({ path: 'vacancies_length.png' });
                if (isStopped()) {
                    await stop(browser);
                    return;
                }

                console.log('Vacancies found', vacancies.length);
                console.log('Sent feedback:', counters.successfullySubmittedCount, 'UnSent feedback:', counters.unsuccessfullySubmittedCount);

                await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
                try {
                    existingVacanciesIds.add(data.id);
                    if (vacancyResponse) {
                        await processVacancy({ page, vacancyResponse, data, counters, message, userId });
                        vacancies = (await getVacancies(page)).filter(({ data }) => data.id && !existingVacanciesIds.has(data.id));
                    } else {
                        console.error(`Vacancy response for ID ${data.id} is null.`);
                    }
                } catch (err) {
                    console.error(`Error processing vacancy with ID ${data.id}:`, err);
                }
            }

            const nextPageButtonHandle = await page.$(SELECTORS.PAGER_NEXT);
            if (nextPageButtonHandle) {
                console.log('Go to the next page.');
                await page.screenshot({ path: 'next_ page.png' });

                await nextPageButtonHandle.click();
                await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
                currentPage++;
            } else {
                break;
            }

            if (isStopped()) {
                await stop(browser);
                return;
            }
        } catch (err) {
            console.error('Error during page processing:', err);
        }
    }
}
