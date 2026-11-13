import { HH_SCRAPE } from '@config';
import { NavigateAndProcessVacanciesParams } from '@interface';
import { delayBeforeApply, isStopped, readApplyCap, stop } from '@utils';
import { updateJob } from '../../../job/store.js';
import { patchLiveApplySummary } from '../../helpers/patchLiveApplySummary.js';
import { stage } from '../../helpers/stageLog.js';
import { ensureSerpReady } from './ensureSerpReady.js';
import { getVacancies } from './getVacancies.js';
import { goToNextSerpPage } from './goToNextSerpPage.js';
import { processVacancy } from './processVacancy.js';
import { readSerpFoundCount } from './readSerpFoundCount.js';

export type ApplyLoopStats = {
    pages: number;
    found: number;
    foundListed?: number;
    applyablePage1?: number;
    alreadyInDb?: number;
    endReason: 'last_page' | 'page_cap' | 'apply_cap' | 'dry_run' | 'stopped';
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
    dryRun = false,
    applyCap,
}: NavigateAndProcessVacanciesParams): Promise<ApplyLoopStats> {
    const successCap = readApplyCap(applyCap);
    let currentPage = 0;
    let consecutiveApplyFailures = 0;
    const maxPages = HH_SCRAPE.TOTAL_PAGES;
    /** Already handled (DB + this run) — meet again on SERP → skip, do not re-apply. */
    const processedIds = new Set<number>();
    let liveSerpUrl = serpUrl || page.url();
    let pagesVisited = 0;
    let found = 0;
    let foundListed = 0;
    let applyablePage1 = 0;
    let alreadyInDb = 0;
    let announcedFound = false;

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
            return packStats('stopped');
        }

        try {
            pagesVisited = currentPage + 1;
            stage('page', `${pagesVisited}/${maxPages}`);
            await ensureSerpReady(page, liveSerpUrl);
            liveSerpUrl = page.url();

            if (!announcedFound) {
                const listed = await readSerpFoundCount(page);
                const applyableNow = (await getVacancies(page)).filter(({ data }) => {
                    const id = toVacancyId(data.id);
                    return id !== null && !processedIds.has(id);
                }).length;
                foundListed = listed;
                applyablePage1 = applyableNow;
                alreadyInDb = processedIds.size;
                found = listed > 0 ? listed : applyableNow;
                const lastEvent =
                    listed > 0
                        ? `Найдено ${listed} вакансий (к отклику на стр.1: ${applyableNow}, уже в базе: ${processedIds.size})`
                        : `Найдено ${applyableNow} вакансий к отклику на стр.1 (уже в базе: ${processedIds.size})`;
                updateJob(jobId, {
                    lastEvent,
                    lastEventAt: new Date().toISOString(),
                    summary: {
                        found,
                        foundListed: listed > 0 ? listed : undefined,
                        applyablePage1: applyableNow,
                        alreadyInDb: processedIds.size,
                        success: 0,
                        skipped: 0,
                        failed: 0,
                        pages: 0,
                    },
                });
                broadcast.broadcast(lastEvent);
                stage('found', lastEvent);
                announcedFound = true;
            }

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

                if (successCap && counters.successfullySubmittedCount >= successCap) {
                    stage('apply cap', `ok=${counters.successfullySubmittedCount} cap=${successCap}`);
                    return packStats('apply_cap');
                }

                if (dryRun) {
                    stage('dry-run', `list-only ${vacancyId}`);
                    counters.skippedCount++;
                    patchLiveApplySummary(jobId, counters, pagesVisited);
                    continue;
                }

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
                        // No Magritte picture / unsolved — fail this card and keep the loop
                        // (do not tear down the browser; that hid found-count UI on error).
                        stage('captcha', 'unsolved — continue queue');
                        consecutiveApplyFailures += 1;
                        liveSerpUrl = page.url();
                        patchLiveApplySummary(jobId, counters, pagesVisited);
                        await ensureSerpReady(page, liveSerpUrl).catch(() => undefined);
                        continue;
                    }

                    consecutiveApplyFailures = result === 'fail' ? consecutiveApplyFailures + 1 : 0;
                    liveSerpUrl = page.url();
                    patchLiveApplySummary(jobId, counters, pagesVisited);
                } catch (err) {
                    consecutiveApplyFailures += 1;
                    console.error(`Error processing vacancy with ID ${data.id}:`, err);
                    patchLiveApplySummary(jobId, counters, pagesVisited);
                    await ensureSerpReady(page, liveSerpUrl).catch(() => undefined);
                }
            }

            if (isStopped()) {
                await stop(browser);
                return packStats('stopped');
            }

            const moved = await goToNextSerpPage(page);
            if (!moved) {
                stage('pager end', `last page reached (${pagesVisited})`);
                return packStats('last_page');
            }
            currentPage++;
            liveSerpUrl = page.url();
        } catch (err) {
            if (err instanceof Error && /CAPTCHA/i.test(err.message)) {
                throw err;
            }
            console.error('Error during page processing:', err);
            const moved = await goToNextSerpPage(page).catch(() => false);
            if (!moved) {
                return packStats('last_page', pagesVisited || currentPage + 1);
            }
            currentPage++;
            liveSerpUrl = page.url();
            await ensureSerpReady(page, liveSerpUrl).catch(() => undefined);
        }
    }

    stage('pager cap', `reached HH_TOTAL_PAGES=${maxPages}`);
    return packStats('page_cap', pagesVisited || currentPage + 1);

    function packStats(
        endReason: 'last_page' | 'page_cap' | 'apply_cap' | 'dry_run' | 'stopped',
        pages = pagesVisited,
    ): ApplyLoopStats {
        return {
            pages,
            found,
            foundListed: foundListed || undefined,
            applyablePage1: announcedFound ? applyablePage1 : undefined,
            alreadyInDb: announcedFound ? alreadyInDb : undefined,
            endReason,
        };
    }
}
