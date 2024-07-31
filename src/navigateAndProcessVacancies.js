// src/navigateAndProcessVacancies.js
import { processVacancy } from './processVacancy.js';
import { getVacancies } from './getVacancies.js';
import { personalData } from '../secrets.js';
import { SELECTORS, TIMEOUTS } from '../constants.js';
import { getList } from '../db.js';

export async function navigateAndProcessVacancies(page, counters, message, isStopped) {
    let currentPage = 0;
    const { totalPages } = personalData;

    let existingVacanciesIds;
    try {
        const existingVacancies = await getList();
        existingVacanciesIds = new Set(existingVacancies.map(vacancy => vacancy.id));
    } catch (err) {
        return;
    }

    while (currentPage < totalPages) {
        if (isStopped()) {
            return;
        }
        try {
            console.log(`Processing page ${currentPage + 1} из ${totalPages}`);

            let vacancies = await getVacancies(page);
            vacancies = vacancies.filter(({ data }) => data.id && !existingVacanciesIds.has(data.id));
            console.log('Vacancies found', vacancies.length);

            if (vacancies.length === 0) {
                break;
            }

            for (const { data, vacancyResponse } of vacancies) {
                if (isStopped()) {
                    return;
                }

                console.log('Sent feedback:', counters.successfullySubmittedCount, 'UnSent feedback:', counters.unsuccessfullySubmittedCount);

                await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
                try {
                    existingVacanciesIds.add(data.id);
                    await processVacancy(page, vacancyResponse, data, counters, message);
                    vacancies = (await getVacancies(page)).filter(({ data }) => data.id && !existingVacanciesIds.has(data.id));
                } catch (err) {
                    console.error(`Error processing vacancy with ID ${data.id}:`, err);
                }
            }

            const nextPageButtonHandle = await page.$(SELECTORS.PAGER_NEXT);
            if (nextPageButtonHandle) {
                console.log('Go to the next page.');
                await nextPageButtonHandle.click();
                await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
                currentPage++;
            } else {
                break;
            }
            if (isStopped()) {
                return;
            }
        } catch (err) {
            console.error('Error during page processing:', err);
        }
    }
}
