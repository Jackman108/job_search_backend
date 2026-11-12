//index.ts
import * as dotenv from 'dotenv';
import { Browser, Page } from 'puppeteer';
import { Counters, SendFeedbackParams } from '@interface';
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
): void {
    const success = counters.successfullySubmittedCount;
    const skipped = counters.skippedCount + counters.failedCount;
    const existingFound = readJob(jobId)?.summary?.found ?? 0;
    const summary = {
        found: found || existingFound || undefined,
        success,
        skipped,
        failed: counters.failedCount,
        pages,
    };
    const foundBit = summary.found ? `, найдено было ${summary.found}` : '';
    const lastEvent = `Поиск вакансий окончен: откликов ${success}, пропущено ${skipped}${foundBit}`;
    updateJob(jobId, {
        summary,
        lastEvent,
        lastEventAt: new Date().toISOString(),
    });
    broadcast.broadcast(lastEvent);
    stage(
        'done',
        `ok=${success} skip=${counters.skippedCount} fail=${counters.failedCount} pages=${pages} found=${summary.found ?? 0}`,
    );
}

export async function sendFeedback(
    { userId, email, password, position, message, vacancyUrl }: SendFeedbackParams,
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

    try {
        stage('start', `user=${userId}`);
        ({ browser, page } = await launchHhBrowser());

        await initializeBrowser(vacancyUrl, browser, page, deps.broadcast);

        stage('login');
        await authorize(page, email, password, browser, deps.broadcast, deps.jobId);
        if (isStopped()) {
            stage('stopped', 'before search');
            persistApplySummary(deps.jobId, counters, pages, deps.broadcast, found);
            await stop(browser);
            return;
        }

        // Login leaves applicant home /account — reopen the form SERP before typing.
        stage('search', position);
        const serpUrl = await searchForVacancy({ page, position, vacancyUrl });
        if (isStopped()) {
            stage('stopped', 'before apply loop');
            persistApplySummary(deps.jobId, counters, pages, deps.broadcast, found);
            await stop(browser);
            return;
        }

        stage('apply loop');
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
        });
        pages = stats.pages;
        found = stats.found;
        await page.screenshot({ path: 'screenshot-navigate.png' }).catch(() => null);
        persistApplySummary(deps.jobId, counters, pages, deps.broadcast, found);
    } catch (err) {
        // Still expose partial totals when the run aborts mid-way.
        try {
            persistApplySummary(deps.jobId, counters, pages, deps.broadcast, found);
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
