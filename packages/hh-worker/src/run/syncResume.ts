import * as dotenv from 'dotenv';
import { Browser, Page } from 'puppeteer';
import type { SyncResumeParams } from '@market-hunter/contracts';
import { isStopped, stop } from '@market-hunter/hh-worker/lib';
import { authorize, initializeBrowser } from '@run';
import type { ScenarioDeps } from '../job/processJob.deps.js';
import { updateJob } from '../job/store.js';
import { launchHhBrowser } from './helpers/launchHhBrowser.js';
import { stage } from './helpers/stageLog.js';
import { fetchFirstHhResume } from './modules/resume/fetchFirstHhResume.js';
import { mapHhResume } from './modules/resume/mapHhResume.js';

dotenv.config();

const RESUMES_URL = 'https://hh.ru/applicant/resumes';

export async function syncResume(
    { userId, email, password }: SyncResumeParams,
    deps: Pick<ScenarioDeps, 'resumeRepo' | 'broadcast'> & { jobId: string },
): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        stage('start syncResume', `user=${userId}`);
        updateJob(deps.jobId, {
            lastEvent: 'HH resume sync: login',
            lastEventAt: new Date().toISOString(),
        });
        ({ browser, page } = await launchHhBrowser());
        await initializeBrowser(RESUMES_URL, browser, page, deps.broadcast);

        stage('login');
        await authorize(page, email, password, browser, deps.broadcast, deps.jobId);
        if (isStopped()) {
            stage('stopped', 'before fetch resume');
            await stop(browser);
            return;
        }

        updateJob(deps.jobId, {
            lastEvent: 'HH resume sync: fetching first resume',
            lastEventAt: new Date().toISOString(),
        });
        stage('fetch resume');
        const raw = await fetchFirstHhResume(page);
        const mapped = mapHhResume(raw);

        updateJob(deps.jobId, {
            lastEvent: `HH resume sync: saving «${mapped.resume.position || mapped.resume.full_name}»`,
            lastEventAt: new Date().toISOString(),
        });
        stage('upsert');
        await deps.resumeRepo.upsertFromHh(userId, mapped);
        stage('done syncResume');
        updateJob(deps.jobId, {
            lastEvent: `Резюме синхронизировано: ${mapped.resume.full_name}`,
            lastEventAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Error during resume sync:', err);
        throw err;
    } finally {
        if (browser && page && !page.isClosed()) {
            await stop(browser);
        }
    }
}
