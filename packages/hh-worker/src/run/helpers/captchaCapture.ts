import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { JOBS_DIR } from '../../job/store.js';
import { stage } from './stageLog.js';

const MIN_IMAGE_BYTES = 64;
/** Region above CAPTCHA_INPUT where HH renders the picture. */
const REGION_ABOVE_INPUT_PX = 200;
const REGION_PAD_PX = 24;

export const isPictureUrl = (src: string): boolean => /captcha\/picture/i.test(src);

export function captchaImagePath(jobId: string): string {
    return path.join(JOBS_DIR, `${jobId}-captcha.png`);
}

export function isCaptchaImageReady(file: string): boolean {
    return fs.existsSync(file) && fs.statSync(file).size > MIN_IMAGE_BYTES;
}

export async function readCaptchaSrc(page: Page): Promise<string> {
    return page
        .evaluate((sel) => {
            const nodes = Array.from(document.querySelectorAll(sel)) as HTMLImageElement[];
            const hit = nodes.find((img) => /captcha\/picture/i.test(img.currentSrc || img.src || ''));
            return hit?.currentSrc || hit?.src || '';
        }, SELECTORS.CAPTCHA_IMAGE)
        .catch(() => '');
}

/** Click Magritte refresh when the picture failed to load / is late. */
export async function refreshCaptchaPicture(page: Page): Promise<string> {
    await page
        .evaluate(() => {
            const btn =
                (document.querySelector('[data-qa="captcha-refresh"], [data-qa*="captcha"] button') as HTMLElement) ||
                Array.from(document.querySelectorAll('button')).find((b) => /обнов|refresh/i.test(b.textContent || ''));
            btn?.click();
        })
        .catch(() => undefined);
    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT * 2));
    return readCaptchaSrc(page);
}

/** Never throws; empty array = not a valid image payload. */
async function fetchPictureBytes(page: Page, url: string): Promise<number[]> {
    return page
        .evaluate(async (src) => {
            const res = await fetch(src, {
                credentials: 'include',
                cache: 'no-store',
                headers: { Accept: 'image/*,*/*' },
            });
            if (!res.ok) return [];
            const buf = new Uint8Array(await res.arrayBuffer());
            if (buf.length < 64) return [];
            const head = String.fromCharCode(...buf.slice(0, 15));
            if (/<!doctype|<html/i.test(head)) return [];
            return Array.from(buf);
        }, url)
        .catch(() => [] as number[]);
}

/** Small clip around the CAPTCHA input — never the full page. */
async function shotRegionNearInput(page: Page, out: string): Promise<boolean> {
    const input = await page.$(SELECTORS.CAPTCHA_INPUT).catch(() => null);
    const box = input ? await input.boundingBox().catch(() => null) : null;
    if (!box) return false;
    const y = Math.max(0, box.y - REGION_ABOVE_INPUT_PX);
    const clip = {
        x: Math.max(0, box.x - REGION_PAD_PX),
        y,
        width: box.width + REGION_PAD_PX * 2,
        height: box.y + box.height - y + REGION_PAD_PX,
    };
    await page.screenshot({ path: out as `${string}.png`, clip }).catch(() => undefined);
    return isCaptchaImageReady(out);
}

/**
 * Snapshot CAPTCHA image for a human (headless — no Chrome window).
 * Order: fetch picture URL → element shot → clipped region near CAPTCHA_INPUT.
 * Returns the output path; use isCaptchaImageReady() to know if a file was produced.
 */
export async function saveCaptchaImage(jobId: string, page: Page, captchaSrc: string): Promise<string> {
    const out = captchaImagePath(jobId);
    if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
    // Drop a stale picture from a previous attempt so the client never shows an old CAPTCHA.
    fs.rmSync(out, { force: true });

    if (captchaSrc && isPictureUrl(captchaSrc)) {
        const bytes = await fetchPictureBytes(page, captchaSrc);
        if (bytes.length > MIN_IMAGE_BYTES) {
            fs.writeFileSync(out, Buffer.from(bytes));
            stage('captcha image', `${out} (${bytes.length}b fetch)`);
            return out;
        }
    }

    const handle = await page.$(SELECTORS.CAPTCHA_IMAGE).catch(() => null);
    if (handle) {
        await handle.screenshot({ path: out }).catch(() => undefined);
        if (isCaptchaImageReady(out)) {
            stage('captcha image', `${out} (element shot)`);
            return out;
        }
    }

    if (await shotRegionNearInput(page, out)) {
        stage('captcha image', `${out} (region shot near input)`);
        return out;
    }

    // Last resort: viewport shot so the human modal always has *something*
    // when Magritte picture URL/element is late (login CAPTCHA is usually on-screen).
    await page.screenshot({ path: out as `${string}.png`, type: 'png' }).catch(() => undefined);
    if (isCaptchaImageReady(out)) {
        stage('captcha image', `${out} (viewport shot fallback)`);
        return out;
    }

    stage('captcha image', 'capture failed — will keep waiting / refreshing');
    return out;
}
