import { HH_SCRAPE } from '@config';
import { NavigateAndProcessVacanciesParams } from '@interface';
import { delayBeforeApply, isStopped, stop } from '@utils';
import { stage } from '../../helpers/stageLog.js';
import { ensureSerpReady } from './ensureSerpReady.js';
import { getVacancies } from './getVacancies.js';
import { goToNextSerpPage } from './goToNextSerpPage.js';
import { processVacancy } from './processVacancy.js';

export type ApplyLoopStats = {
    pages: number;
};

/** pg BIGINT / JSON often arrive as string — normalize so the skip Set matches SERP ids. */
function toVacancyId(raw: unknown): number | null {
    const id = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
}

export async function navigateAndProcessVacancies({
    userId,
    page,
    counters,
    message,
    browser,
    vacancyRepo,
    broadcast,
    jobId,
    serpUrl,
}: NavigateAndProcessVacanciesParams): Promise<ApplyLoopStats> {
    let currentPage = 0;
    let consecutiveApplyFailures = 0;
    const maxPages = HH_SCRAPE.TOTAL_PAGES;
    /** Already handled (DB + this run) — meet again on SERP → skip, do not re-apply. */
    const processedIds = new Set<number>();
    let liveSerpUrl = serpUrl || page.url();
    let pagesVisited = 0;

    try {
        const vacanciesFromDb = await vacancyRepo.getVacanciesUser(userId);
        for (const vacancy of vacanciesFromDb) {
            const id = toVacancyId(vacancy.id);
            if (id) processedIds.add(id);
        }
        stage('skip set', `${processedIds.size} already in DB`);
    } catch (err) {
        console.error(`Error retrieving vacancies for user ${userId}: ${err}`);
        throw err instanceof Error ? err : new Error(String(err));
    }

    stage('apply loop');

    while (currentPage < maxPages) {
        if (isStopped()) {
            await stop(browser);
            return { pages: pagesVisited };
        }

        try {
            pagesVisited = currentPage + 1;
            stage('page', `${pagesVisited}/${maxPages}`);
            await ensureSerpReady(page, liveSerpUrl);
            liveSerpUrl = page.url();

            // Always take the next live card — never iterate stale ElementHandles.
            while (!isStopped()) {
                const remaining = (await getVacancies(page)).filter(({ data }) => {
                    const id = toVacancyId(data.id);
                    return id !== null && !processedIds.has(id);
                });
                if (remaining.length === 0) {
                    stage('page empty');
                    break;
                }

                const { data } = remaining[0];
                const vacancyId = toVacancyId(data.id);
                if (!vacancyId) continue;
                // Mark before apply so a retry/re-scrape in the same run cannot re-queue it.
                processedIds.add(vacancyId);
                data.id = vacancyId;

                stage(
                    'queue',
                    `${processedIds.size} · left=${remaining.length} · ok=${counters.successfullySubmittedCount} skip=${counters.skippedCount} fail=${counters.failedCount}`,
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
                        jobId,
                        serpUrl: liveSerpUrl,
                    });

                    if (result === 'captcha') {
                        broadcast.broadcast('CAPTCHA mid-apply unsolved — stopping browser');
                        await stop(browser);
                        throw new Error('CAPTCHA mid-apply unsolved — stopping browser');
                    }

                    consecutiveApplyFailures = result === 'fail' ? consecutiveApplyFailures + 1 : 0;
                    liveSerpUrl = page.url();
                } catch (err) {
                    consecutiveApplyFailures += 1;
                    console.error(`Error processing vacancy with ID ${data.id}:`, err);
                    if (err instanceof Error && /CAPTCHA/i.test(err.message)) {
                        throw err;
                    }
                    await ensureSerpReady(page, liveSerpUrl).catch(() => undefined);
                }
            }

            if (isStopped()) {
                await stop(browser);
                return { pages: pagesVisited };
            }

            const moved = await goToNextSerpPage(page);
            if (!moved) {
                stage('pager end', `last page reached (${pagesVisited})`);
                break;
            }
            currentPage++;
            liveSerpUrl = page.url();
        } catch (err) {
            if (err instanceof Error && /CAPTCHA/i.test(err.message)) {
                throw err;
            }
            console.error('Error during page processing:', err);
            const moved = await goToNextSerpPage(page).catch(() => false);
            if (!moved) break;
            currentPage++;
            liveSerpUrl = page.url();
            await ensureSerpReady(page, liveSerpUrl).catch(() => undefined);
        }
    }

    if (currentPage >= maxPages) {
        stage('pager cap', `reached HH_TOTAL_PAGES=${maxPages}`);
    }

    return { pages: pagesVisited || currentPage + 1 };
}
