import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { JOBS_DIR, readJob, takeCaptchaAnswer, updateJob } from '../../job/store.js';
import { clickByExactText } from './clickByExactText.js';
import { stage } from './stageLog.js';

const DEFAULT_WAIT_MS = 5 * 60 * 1000;
const POLL_MS = 1500;
const MAX_ATTEMPTS = 5;

const isPictureUrl = (src: string) => /captcha\/picture/i.test(src);

export function captchaImagePath(jobId: string): string {
    return path.join(JOBS_DIR, `${jobId}-captcha.png`);
}

export async function readCaptchaSrc(page: Page): Promise<string> {
    return page
        .evaluate((sel) => {
            const nodes = Array.from(document.querySelectorAll(sel)) as HTMLImageElement[];
            const hit = nodes.find((img) => /captcha\/picture/i.test(img.src || ''));
            return hit?.src || '';
        }, SELECTORS.CAPTCHA_IMAGE)
        .catch(() => '');
}

/** Snapshot CAPTCHA image for human solve (headless — no Chrome window). */
export async function saveCaptchaImage(jobId: string, page: Page, captchaSrc: string): Promise<string> {
    const out = captchaImagePath(jobId);
    if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });

    if (captchaSrc && isPictureUrl(captchaSrc)) {
        const bytes = await page
            .evaluate(async (url) => {
                const res = await fetch(url, {
                    credentials: 'include',
                    cache: 'no-store',
                    headers: { Accept: 'image/*,*/*' },
                });
                if (!res.ok) return [];
                const buf = new Uint8Array(await res.arrayBuffer());
                // Reject HTML / tiny payloads mistaken for PNG.
                if (buf.length < 64) return [];
                const head = String.fromCharCode(...buf.slice(0, 15));
                if (/<!doctype|<html/i.test(head)) return [];
                return Array.from(buf);
            }, captchaSrc)
            .catch(() => [] as number[]);
        if (bytes.length > 64) {
            fs.writeFileSync(out, Buffer.from(bytes));
            stage('captcha image', `${out} (${bytes.length}b fetch)`);
            return out;
        }
    }

    const handle = await page.$(SELECTORS.CAPTCHA_IMAGE);
    if (handle) {
        await handle.screenshot({ path: out }).catch(() => undefined);
        if (fs.existsSync(out) && fs.statSync(out).size > 64) {
            stage('captcha image', `${out} (element shot)`);
            return out;
        }
    }

    // Last resort: full-page shot so GET /jobs/:id/captcha-image is never empty while waiting.
    await page.screenshot({ path: out, fullPage: false }).catch(() => undefined);
    if (fs.existsSync(out) && fs.statSync(out).size > 64) {
        stage('captcha image', `${out} (page shot fallback)`);
        return out;
    }

    stage('captcha image', 'capture failed');
    return out;
}

async function pollAnswer(jobId: string, deadline: number): Promise<string | null> {
    while (Date.now() < deadline) {
        const job = readJob(jobId);
        if (!job || job.status === 'cancelled') return null;

        // Prefer side-channel file (survives concurrent JSON updates).
        const fromFile = takeCaptchaAnswer(jobId);
        const answer = fromFile || job.captchaAnswer?.trim() || '';
        if (answer) {
            try {
                updateJob(jobId, {
                    captchaAnswer: undefined,
                    awaitingCaptcha: false,
                    lastEvent: 'CAPTCHA answer received',
                    lastEventAt: new Date().toISOString(),
                });
            } catch (err) {
                console.error(`pollAnswer(${jobId}): updateJob after answer failed`, err);
            }
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

async function ensureCaptchaPicture(page: Page, hintSrc: string): Promise<string> {
    let src = (hintSrc && isPictureUrl(hintSrc) ? hintSrc : '') || (await readCaptchaSrc(page));
    if (src) return src;

    // Magritte refresh control when the picture failed to load.
    await page
        .evaluate(() => {
            const btn =
                (document.querySelector('[data-qa="captcha-refresh"], [data-qa*="captcha"] button') as HTMLElement) ||
                Array.from(document.querySelectorAll('button')).find((b) => /обнов|refresh/i.test(b.textContent || ''));
            btn?.click();
        })
        .catch(() => undefined);
    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT * 2));
    src = await readCaptchaSrc(page);
    return src;
}

/**
 * Headless human-in-the-loop: expose captchaSrc + local PNG, wait for
 * POST /jobs/:id/captcha. Retries with a fresh image if the answer was wrong.
 */
export async function waitAndSubmitCaptchaAnswer(jobId: string, page: Page, captchaSrc: string): Promise<boolean> {
    const budget = Number(process.env.HH_CAPTCHA_WAIT_MS) || DEFAULT_WAIT_MS;
    const deadline = Date.now() + budget;
    let currentSrc = await ensureCaptchaPicture(page, captchaSrc);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && Date.now() < deadline; attempt++) {
        currentSrc = (await ensureCaptchaPicture(page, currentSrc)) || currentSrc;
        const imagePath = await saveCaptchaImage(jobId, page, currentSrc);
        const imageReady = fs.existsSync(imagePath) && fs.statSync(imagePath).size > 64;

        updateJob(jobId, {
            awaitingCaptcha: true,
            captchaSrc: currentSrc && isPictureUrl(currentSrc) ? currentSrc : undefined,
            captchaImagePath: imageReady ? imagePath : undefined,
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
    }

    stage('captcha', 'exhausted retries / budget');
    return false;
}
