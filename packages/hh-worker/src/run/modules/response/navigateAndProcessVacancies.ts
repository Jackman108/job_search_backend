import { HH_SCRAPE } from '@config';
import { NavigateAndProcessVacanciesParams } from '@interface';
import { delayBeforeApply, isStopped, stop } from '@utils';
import { stage } from '../../helpers/stageLog.js';
import { ensureSerpReady } from './ensureSerpReady.js';
import { getVacancies } from './getVacancies.js';
import { goToNextSerpPage } from './goToNextSerpPage.js';
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
    let consecutiveApplyFailures = 0;
    const totalPages = HH_SCRAPE.TOTAL_PAGES;
    const processedIds = new Set<number>();

    try {
        const vacanciesFromDb = await vacancyRepo.getVacanciesUser(userId);
        for (const vacancy of vacanciesFromDb) {
            if (vacancy.id) processedIds.add(vacancy.id);
        }
    } catch (err) {
        console.error(`Error retrieving vacancies for user ${userId}: ${err}`);
        return;
    }

    stage('apply loop');

    while (currentPage < totalPages) {
        if (isStopped()) {
            await stop(browser);
            return;
        }

        try {
            stage('page', `${currentPage + 1}/${totalPages}`);
            await ensureSerpReady(page);

            // Always take the next live card — never iterate stale ElementHandles.
            while (!isStopped()) {
                const remaining = (await getVacancies(page)).filter(
                    ({ data }) => data.id && !processedIds.has(data.id),
                );
                if (remaining.length === 0) {
                    stage('page empty');
                    break;
                }

                const { data } = remaining[0];
                processedIds.add(data.id);

                stage(
                    'queue',
                    `${processedIds.size} · left=${remaining.length} · ok=${counters.successfullySubmittedCount} fail=${counters.unsuccessfullySubmittedCount}`,
                );

                const waitedMs = await delayBeforeApply(consecutiveApplyFailures);
                stage('pace', `${waitedMs}ms (failures=${consecutiveApplyFailures})`);

                try {
                    const result = await processVacancy({
                        page,
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
                } catch (err) {
                    consecutiveApplyFailures += 1;
                    console.error(`Error processing vacancy with ID ${data.id}:`, err);
                    if (err instanceof Error && /CAPTCHA/i.test(err.message)) {
                        throw err;
                    }
                    await ensureSerpReady(page).catch(() => undefined);
                }
            }

            if (isStopped()) {
                await stop(browser);
                return;
            }

            const moved = await goToNextSerpPage(page);
            if (!moved) break;
            currentPage++;
        } catch (err) {
            if (err instanceof Error && /CAPTCHA/i.test(err.message)) {
                throw err;
            }
            console.error('Error during page processing:', err);
            currentPage++;
            await ensureSerpReady(page).catch(() => undefined);
        }
    }
}
