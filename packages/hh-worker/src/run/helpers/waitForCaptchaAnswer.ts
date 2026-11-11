import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { JOBS_DIR, readJob, updateJob } from '../../job/store.js';
import { clickByExactText } from './clickByExactText.js';
import { stage } from './stageLog.js';

const DEFAULT_WAIT_MS = 5 * 60 * 1000;
const POLL_MS = 1500;

export function captchaImagePath(jobId: string): string {
    return path.join(JOBS_DIR, `${jobId}-captcha.png`);
}

/** Snapshot CAPTCHA image for human solve (headless — no Chrome window). */
export async function saveCaptchaImage(jobId: string, page: Page, captchaSrc: string): Promise<string> {
    const out = captchaImagePath(jobId);
    if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });

    const handle = await page.$(SELECTORS.CAPTCHA_IMAGE);
    if (handle) {
        await handle.screenshot({ path: out }).catch(() => undefined);
    }

    if ((!fs.existsSync(out) || fs.statSync(out).size < 32) && captchaSrc) {
        const bytes = await page
            .evaluate(async (url) => {
                const res = await fetch(url, { credentials: 'include' });
                if (!res.ok) return [];
                return Array.from(new Uint8Array(await res.arrayBuffer()));
            }, captchaSrc)
            .catch(() => [] as number[]);
        if (bytes.length) fs.writeFileSync(out, Buffer.from(bytes));
    }

    stage('captcha image', out);
    return out;
}

async function pollAnswer(jobId: string, budgetMs: number): Promise<string | null> {
    const deadline = Date.now() + budgetMs;
    while (Date.now() < deadline) {
        const job = readJob(jobId);
        if (!job || job.status === 'cancelled') return null;
        const answer = job.captchaAnswer?.trim();
        if (answer) {
            updateJob(jobId, {
                captchaAnswer: undefined,
                awaitingCaptcha: false,
                lastEvent: 'CAPTCHA answer received',
                lastEventAt: new Date().toISOString(),
            });
            return answer;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
    }
    return null;
}

/**
 * Headless human-in-the-loop: expose captchaSrc + local PNG, wait for
 * POST /jobs/:id/captcha (or job.captchaAnswer), type answer, submit modal.
 */
export async function waitAndSubmitCaptchaAnswer(jobId: string, page: Page, captchaSrc: string): Promise<boolean> {
    const imagePath = await saveCaptchaImage(jobId, page, captchaSrc);
    updateJob(jobId, {
        awaitingCaptcha: true,
        captchaSrc: captchaSrc || undefined,
        captchaImagePath: imagePath,
        captchaAnswer: undefined,
        lastEvent: `CAPTCHA awaiting answer ${captchaSrc || imagePath}`,
        lastEventAt: new Date().toISOString(),
    });
    stage('captcha', 'awaiting POST /jobs/:id/captcha (headless)');

    const budget = Number(process.env.HH_CAPTCHA_WAIT_MS) || DEFAULT_WAIT_MS;
    const answer = await pollAnswer(jobId, budget);
    if (!answer) {
        stage('captcha', 'no answer / cancelled / timeout');
        return false;
    }

    stage('captcha', 'typing answer');
    const input = await page.waitForSelector(SELECTORS.CAPTCHA_INPUT, {
        timeout: TIMEOUTS.SEARCH,
        visible: true,
    });
    if (!input) return false;
    await input.click({ clickCount: 3 }).catch(() => undefined);
    await input.type(answer, { delay: 40 });

    const submitted =
        (await clickByExactText(page, 'Отправить', { timeout: TIMEOUTS.SEARCH })) ||
        (await page.evaluate(() => {
            const btn = document.querySelector(
                'button[type="submit"], [data-qa="account-captcha-submit"]',
            ) as HTMLElement | null;
            btn?.click();
            return Boolean(btn);
        }));

    if (!submitted) {
        stage('captcha', 'submit control not found');
        return false;
    }

    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT * 2));
    const still = await page.$(SELECTORS.CAPTCHA_IMAGE).catch(() => null);
    if (still) {
        stage('captcha', 'still visible after submit (wrong answer?)');
        return false;
    }

    stage('captcha', 'accepted');
    updateJob(jobId, {
        awaitingCaptcha: false,
        captchaSrc: undefined,
        captchaImagePath: undefined,
        lastEvent: 'CAPTCHA accepted',
        lastEventAt: new Date().toISOString(),
    });
    return true;
}
