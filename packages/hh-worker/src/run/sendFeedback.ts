//index.ts
import * as dotenv from 'dotenv';
import { Browser, Page } from 'puppeteer';
import { Counters, HhApplyEndReason, SendFeedbackParams } from '@interface';
import type { ScenarioDeps } from '../job/processJob.deps.js';
import { readJob, updateJob } from '../job/store.js';
import { isStopped, stop } from '@utils';
import { authorize, initializeBrowser, navigateAndProcessVacancies, searchForVacancy } from '@run';
import { launchHhBrowser } from './helpers/launchHhBrowser.js';
import { stage } from './helpers/stageLog.js';

dotenv.config();

function persistApplySummary(
    jobId: string,
    counters: Counters,
    pages: number,
    broadcast: ScenarioDeps['broadcast'],
    found = 0,
    endReason: HhApplyEndReason = 'last_page',
    foundExtra?: {
        foundListed?: number;
        applyablePage1?: number;
        alreadyInDb?: number;
    },
): void {
    const success = counters.successfullySubmittedCount;
    const skipped = counters.skippedCount;
    const failed = counters.failedCount;
    const prev = readJob(jobId)?.summary;
    const foundListed = foundExtra?.foundListed ?? prev?.foundListed;
    const applyablePage1 = foundExtra?.applyablePage1 ?? prev?.applyablePage1;
    const alreadyInDb = foundExtra?.alreadyInDb ?? prev?.alreadyInDb;
    const summary = {
        found: found || prev?.found || foundListed || undefined,
        foundListed: foundListed || undefined,
        applyablePage1,
        alreadyInDb,
        success,
        skipped,
        failed,
        pages,
        endReason,
    };
    const foundBit = summary.found ? `, найдено было ${summary.found}` : '';
    const failBit = failed > 0 ? `, ошибки ${failed}` : '';
    const head =
        endReason === 'aborted' || endReason === 'stopped'
            ? 'Поиск прерван'
            : endReason === 'page_cap'
              ? 'Поиск остановлен по лимиту страниц'
              : endReason === 'apply_cap'
                ? 'Поиск остановлен по лимиту откликов'
                : endReason === 'dry_run'
                  ? 'Dry-run: вакансии найдены без откликов'
                  : 'Поиск вакансий окончен';
    const lastEvent = `${head}: откликов ${success}, пропущено ${skipped}${failBit}${foundBit}`;
    updateJob(jobId, {
        summary,
        lastEvent,
        lastEventAt: new Date().toISOString(),
    });
    broadcast.broadcast(lastEvent);
    stage(
        endReason === 'aborted' ? 'aborted' : 'done',
        `reason=${endReason} ok=${success} skip=${skipped} fail=${failed} pages=${pages} found=${summary.found ?? 0}`,
    );
}

export async function sendFeedback(
    { userId, email, password, position, message, vacancyUrl, dryRun, applyCap }: SendFeedbackParams,
    deps: Pick<ScenarioDeps, 'vacancyRepo' | 'broadcast'> & { jobId: string },
): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const counters: Counters = {
        successfullySubmittedCount: 0,
        skippedCount: 0,
        failedCount: 0,
    };
    let pages = 0;
    let found = 0;
    let endReason: HhApplyEndReason = 'last_page';

    try {
        stage('start', `user=${userId}`);
        ({ browser, page } = await launchHhBrowser());

        await initializeBrowser(vacancyUrl, browser, page, deps.broadcast);

        stage('login');
        await authorize(page, email, password, browser, deps.broadcast, deps.jobId);
        if (isStopped()) {
            stage('stopped', 'before search');
            persistApplySummary(deps.jobId, counters, pages, deps.broadcast, found, 'stopped');
            await stop(browser);
            return;
        }

        // Login leaves applicant home /account — reopen the form SERP before typing.
        stage('search', position);
        const serpUrl = await searchForVacancy({ page, position, vacancyUrl });
        if (isStopped()) {
            stage('stopped', 'before apply loop');
            persistApplySummary(deps.jobId, counters, pages, deps.broadcast, found, 'stopped');
            await stop(browser);
            return;
        }

        stage('apply loop', dryRun ? 'dry-run' : applyCap ? `cap=${applyCap}` : 'full');
        const stats = await navigateAndProcessVacancies({
            userId,
            page,
            counters,
            message,
            browser,
            vacancyRepo: deps.vacancyRepo,
            broadcast: deps.broadcast,
            jobId: deps.jobId,
            serpUrl,
            dryRun,
            applyCap,
        });
        pages = stats.pages;
        found = stats.found;
        endReason = dryRun && stats.endReason === 'last_page' ? 'dry_run' : stats.endReason;
        const foundExtra = {
            foundListed: stats.foundListed,
            applyablePage1: stats.applyablePage1,
            alreadyInDb: stats.alreadyInDb,
        };
        await page.screenshot({ path: 'screenshot-navigate.png' }).catch(() => null);
        persistApplySummary(deps.jobId, counters, pages, deps.broadcast, found, endReason, foundExtra);
    } catch (err) {
        // Still expose partial totals when the run aborts mid-way.
        try {
            persistApplySummary(deps.jobId, counters, pages, deps.broadcast, found, 'aborted');
        } catch (persistErr) {
            console.error('Failed to persist apply summary:', persistErr);
        }
        console.error('Error during script execution:', err);
        // Rethrow so processJob can mark the job file as error (poll SoT).
        throw err;
    } finally {
        if (browser && page && !page.isClosed()) {
            await stop(browser);
        }
    }
}
