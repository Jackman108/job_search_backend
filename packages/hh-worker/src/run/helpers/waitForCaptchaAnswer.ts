import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { JOBS_DIR, readJob, updateJob } from '../../job/store.js';
import { clickByExactText } from './clickByExactText.js';
import { stage } from './stageLog.js';

const DEFAULT_WAIT_MS = 5 * 60 * 1000;
const POLL_MS = 1500;
const MAX_ATTEMPTS = 5;

export function captchaImagePath(jobId: string): string {
    return path.join(JOBS_DIR, `${jobId}-captcha.png`);
}

async function readCaptchaSrc(page: Page): Promise<string> {
    const handle = await page.$(SELECTORS.CAPTCHA_IMAGE);
    if (!handle) return '';
    return page.evaluate((img) => (img as HTMLImageElement).src || '', handle).catch(() => '');
}

/** Snapshot CAPTCHA image for human solve (headless — no Chrome window). */
export async function saveCaptchaImage(jobId: string, page: Page, captchaSrc: string): Promise<string> {
    const out = captchaImagePath(jobId);
    if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });

    // Prefer network bytes of the picture URL — element screenshots are often cropped.
    if (captchaSrc) {
        const bytes = await page
            .evaluate(async (url) => {
                const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
                if (!res.ok) return [];
                return Array.from(new Uint8Array(await res.arrayBuffer()));
            }, captchaSrc)
            .catch(() => [] as number[]);
        if (bytes.length > 32) {
            fs.writeFileSync(out, Buffer.from(bytes));
            stage('captcha image', out);
            return out;
        }
    }

    const handle = await page.$(SELECTORS.CAPTCHA_IMAGE);
    if (handle) {
        await handle.screenshot({ path: out }).catch(() => undefined);
    }

    stage('captcha image', out);
    return out;
}

async function pollAnswer(jobId: string, deadline: number): Promise<string | null> {
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

async function typeAndSubmitAnswer(page: Page, answer: string): Promise<boolean> {
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
    return true;
}

/**
 * Headless human-in-the-loop: expose captchaSrc + local PNG, wait for
 * POST /jobs/:id/captcha. Retries with a fresh image if the answer was wrong.
 */
export async function waitAndSubmitCaptchaAnswer(jobId: string, page: Page, captchaSrc: string): Promise<boolean> {
    const budget = Number(process.env.HH_CAPTCHA_WAIT_MS) || DEFAULT_WAIT_MS;
    const deadline = Date.now() + budget;
    let currentSrc = captchaSrc || (await readCaptchaSrc(page));

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && Date.now() < deadline; attempt++) {
        const imagePath = await saveCaptchaImage(jobId, page, currentSrc);
        // Cache-bust so the client modal reloads when the picture key changes.
        const displaySrc = currentSrc
            ? `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}t=${Date.now()}`
            : undefined;
        updateJob(jobId, {
            awaitingCaptcha: true,
            captchaSrc: displaySrc || currentSrc || undefined,
            captchaImagePath: imagePath,
            captchaAnswer: undefined,
            lastEvent: `CAPTCHA awaiting answer (try ${attempt}/${MAX_ATTEMPTS}) ${currentSrc || imagePath}`,
            lastEventAt: new Date().toISOString(),
        });
        stage('captcha', `awaiting POST /jobs/:id/captcha (try ${attempt}/${MAX_ATTEMPTS})`);

        const answer = await pollAnswer(jobId, deadline);
        if (!answer) {
            stage('captcha', 'no answer / cancelled / timeout');
            return false;
        }

        stage('captcha', 'typing answer');
        if (!(await typeAndSubmitAnswer(page, answer))) {
            return false;
        }

        const still = await page.$(SELECTORS.CAPTCHA_IMAGE).catch(() => null);
        if (!still) {
            await page
                .waitForFunction(() => !location.pathname.includes('/account/login'), {
                    timeout: TIMEOUTS.MODAL,
                })
                .catch(() => undefined);

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

        stage('captcha', `still visible after submit — retry (${attempt}/${MAX_ATTEMPTS})`);
        currentSrc = await readCaptchaSrc(page);
        // Magritte may keep the same key until refresh — nudge image reload.
        if (currentSrc) {
            await page
                .evaluate((sel) => {
                    const img = document.querySelector(sel) as HTMLImageElement | null;
                    if (!img?.src) return;
                    const u = new URL(img.src, location.origin);
                    u.searchParams.set('_retry', String(Date.now()));
                    img.src = u.toString();
                }, SELECTORS.CAPTCHA_IMAGE)
                .catch(() => undefined);
            await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));
            currentSrc = (await readCaptchaSrc(page)) || currentSrc;
        }
    }

    stage('captcha', 'exhausted retries / budget');
    return false;
}
