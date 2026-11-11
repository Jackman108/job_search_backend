// src/navigateAndProcessVacancies.ts
import { HH_SCRAPE, SELECTORS } from '@config';
import { NavigateAndProcessVacanciesParams, VacancyWithResponse } from '@interface';
import { delayBeforeApply, delayBetweenPages, isStopped, stop } from '@utils';
import { stage } from '../../helpers/stageLog.js';
import { getVacancies } from './getVacancies.js';
import { processVacancy } from './processVacancy.js';

export async function navigateAndProcessVacancies({
    userId,
    page,
    counters,
    message,
    browser,
    vacancyRepo,
    broadcast,
}: NavigateAndProcessVacanciesParams): Promise<void> {
    let currentPage = 0;
    let existingVacanciesIds: Set<number>;
    let consecutiveApplyFailures = 0;
    const totalPages = HH_SCRAPE.TOTAL_PAGES;

    try {
        const vacanciesFromDb = await vacancyRepo.getVacanciesUser(userId);
        existingVacanciesIds = new Set(vacanciesFromDb.map((vacancy) => vacancy.id));
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
            stage('page', `${currentPage + 1}/${totalPages}`);

            let pageVacancies: VacancyWithResponse[] = await getVacancies(page);
            pageVacancies = pageVacancies.filter(({ data }) => data.id && !existingVacanciesIds.has(data.id));
            if (pageVacancies.length === 0) {
                stage('page empty');
                break;
            }

            for (let i = 0; i < pageVacancies.length; i++) {
                const { data, vacancyResponse } = pageVacancies[i];
                await page.screenshot({ path: 'vacancies_length.png' });
                if (isStopped()) {
                    await stop(browser);
                    return;
                }

                stage(
                    'queue',
                    `${i + 1}/${pageVacancies.length} · ok=${counters.successfullySubmittedCount} fail=${counters.unsuccessfullySubmittedCount}`,
                );

                // HH pacing: base + jitter (+ stepped backoff after outer failures)
                const waitedMs = await delayBeforeApply(consecutiveApplyFailures);
                stage('pace', `${waitedMs}ms (failures=${consecutiveApplyFailures})`);
                try {
                    existingVacanciesIds.add(data.id);
                    if (vacancyResponse) {
                        const result = await processVacancy({
                            page,
                            vacancyResponse,
                            data,
                            counters,
                            message,
                            userId,
                            vacancyRepo,
                            broadcast,
                        });
                        if (result === 'captcha') {
                            broadcast.broadcast('CAPTCHA mid-apply — stopping browser');
                            await stop(browser);
                            throw new Error('CAPTCHA mid-apply — stopping browser');
                        }
                        consecutiveApplyFailures = result === 'fail' ? consecutiveApplyFailures + 1 : 0;
                        pageVacancies = (await getVacancies(page)).filter(
                            ({ data }) => data.id && !existingVacanciesIds.has(data.id),
                        );
                    } else {
                        console.error(`Vacancy response for ID ${data.id} is null.`);
                    }
                } catch (err) {
                    consecutiveApplyFailures += 1;
                    console.error(`Error processing vacancy with ID ${data.id}:`, err);
                    // CAPTCHA / hard abort must surface to processJob for poll SoT.
                    if (err instanceof Error && /CAPTCHA/i.test(err.message)) {
                        throw err;
                    }
                }
            }

            const nextPageButtonHandle = await page.$(SELECTORS.PAGER_NEXT);
            if (nextPageButtonHandle) {
                stage('next page');
                await page.screenshot({ path: 'next_ page.png' });

                await nextPageButtonHandle.click();
                const pageWaitMs = await delayBetweenPages();
                stage('pace', `${pageWaitMs}ms after pager`);
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
