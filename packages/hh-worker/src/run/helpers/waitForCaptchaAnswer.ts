import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { readJob, takeCaptchaAnswer, updateJob } from '../../job/store.js';
import {
    captchaImagePath,
    isCaptchaImageReady,
    isPictureUrl,
    readCaptchaSrc,
    refreshCaptchaPicture,
    saveCaptchaImage,
} from './captchaCapture.js';
import { clickByExactText } from './clickByExactText.js';
import { stage } from './stageLog.js';

const DEFAULT_WAIT_MS = 5 * 60 * 1000;
const POLL_MS = 1500;
/** Re-capture / refresh cadence while the picture is still missing. */
const RECAPTURE_MS = 6000;
/** Wrong-answer retries (not "no picture" — that never skips). */
const MAX_WRONG_ANSWERS = 5;

// Re-export so existing importers keep working.
export { captchaImagePath, readCaptchaSrc, saveCaptchaImage };

const now = () => new Date().toISOString();

async function publishCaptcha(jobId: string, src: string, imagePath: string, note: string): Promise<boolean> {
    const ready = isCaptchaImageReady(imagePath);
    try {
        updateJob(jobId, {
            awaitingCaptcha: true,
            captchaSrc: src && isPictureUrl(src) ? src : undefined,
            captchaImagePath: ready ? imagePath : undefined,
            captchaAnswer: undefined,
            lastEvent: `CAPTCHA awaiting answer ${note}`.trim(),
            lastEventAt: now(),
        });
    } catch (err) {
        console.error(`publishCaptcha(${jobId}): updateJob failed`, err);
    }
    return ready;
}

function consumeAnswer(jobId: string): string | null {
    const job = readJob(jobId);
    if (!job || job.status === 'cancelled') return null;
    // Prefer side-channel file (survives concurrent JSON updates).
    const answer = takeCaptchaAnswer(jobId) || job.captchaAnswer?.trim() || '';
    if (!answer) return null;
    try {
        updateJob(jobId, {
            captchaAnswer: undefined,
            awaitingCaptcha: false,
            lastEvent: 'CAPTCHA answer received',
            lastEventAt: now(),
        });
    } catch (err) {
        console.error(`consumeAnswer(${jobId}): updateJob after answer failed`, err);
    }
    return answer;
}

/**
 * Wait for a human answer. While no picture exists yet, keep awaitingCaptcha=true and
 * keep refreshing / re-capturing — never give up early because Magritte is late.
 */
async function waitForAnswerCapturing(
    jobId: string,
    page: Page,
    deadline: number,
    state: { src: string; ready: boolean },
    attempt: number,
): Promise<string | null> {
    let nextCapture = Date.now() + RECAPTURE_MS;
    while (Date.now() < deadline) {
        const job = readJob(jobId);
        if (!job || job.status === 'cancelled') return null;
        const answer = consumeAnswer(jobId);
        if (answer) return answer;

        if (!state.ready && Date.now() >= nextCapture) {
            nextCapture = Date.now() + RECAPTURE_MS;
            state.src = (await readCaptchaSrc(page)) || (await refreshCaptchaPicture(page)) || state.src;
            const imagePath = await saveCaptchaImage(jobId, page, state.src);
            state.ready = await publishCaptcha(
                jobId,
                state.src,
                imagePath,
                `(try ${attempt}, picture late) ${state.src}`,
            );
            if (state.ready) stage('captcha', 'picture arrived while waiting');
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
 * POST /jobs/:id/captcha. Always holds (awaitingCaptcha=true) until answer / cancel /
 * HH_CAPTCHA_WAIT_MS — a missing Magritte picture is retried, never skipped.
 */
export async function waitAndSubmitCaptchaAnswer(jobId: string, page: Page, captchaSrc: string): Promise<boolean> {
    const budget = Number(process.env.HH_CAPTCHA_WAIT_MS) || DEFAULT_WAIT_MS;
    const deadline = Date.now() + budget;
    let src = captchaSrc && isPictureUrl(captchaSrc) ? captchaSrc : await readCaptchaSrc(page);

    for (let attempt = 1; attempt <= MAX_WRONG_ANSWERS && Date.now() < deadline; attempt++) {
        if (!src) src = await refreshCaptchaPicture(page);
        const imagePath = await saveCaptchaImage(jobId, page, src);
        const state = { src, ready: false };
        // Publish BEFORE waiting, even with no picture, so the client modal opens immediately.
        state.ready = await publishCaptcha(
            jobId,
            src,
            imagePath,
            `(try ${attempt}/${MAX_WRONG_ANSWERS}) ${src || imagePath}`,
        );
        stage('captcha', `awaiting POST /jobs/:id/captcha (try ${attempt}, image=${state.ready ? 'yes' : 'pending'})`);

        const answer = await waitForAnswerCapturing(jobId, page, deadline, state, attempt);
        if (!answer) {
            stage('captcha', 'no answer / cancelled / timeout');
            clearAwaiting(jobId, 'CAPTCHA wait ended (cancel / timeout)');
            return false;
        }

        stage('captcha', 'typing answer');
        if (!(await typeAndSubmitAnswer(page, answer))) {
            clearAwaiting(jobId, 'CAPTCHA submit control not found');
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
            clearAwaiting(jobId, 'CAPTCHA accepted');
            return true;
        }

        stage('captcha', `still visible after submit — retry (${attempt}/${MAX_WRONG_ANSWERS})`);
        src = await readCaptchaSrc(page);
    }

    clearAwaiting(jobId, 'CAPTCHA exhausted retries / budget');
    stage('captcha', 'exhausted retries / budget');
    return false;
}

function clearAwaiting(jobId: string, lastEvent: string): void {
    try {
        updateJob(jobId, {
            awaitingCaptcha: false,
            captchaSrc: undefined,
            captchaImagePath: undefined,
            lastEvent,
            lastEventAt: now(),
        });
    } catch (err) {
        console.error(`clearAwaiting(${jobId}): updateJob failed`, err);
    }
}
