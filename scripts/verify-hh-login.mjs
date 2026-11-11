/**
 * Guest HH Magritte login click-through (no credentials submitted).
 * Usage: node scripts/verify-hh-login.mjs
 * Headed debug: HH_HEADED=1 node scripts/verify-hh-login.mjs
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import os from 'os';
import path from 'path';

const headed =
    process.env.HH_HEADED === '1' ||
    process.env.HH_HEADED?.toLowerCase() === 'true' ||
    process.env.PUPPETEER_HEADLESS === '0' ||
    process.env.PUPPETEER_HEADLESS?.toLowerCase() === 'false';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-verify-'));
const browser = await puppeteer.launch({
    headless: headed ? false : true,
    args: ['--no-sandbox', `--user-data-dir=${dir}`],
});
const page = await browser.newPage();
page.setDefaultTimeout(30000);
page.setDefaultNavigationTimeout(90000);

async function clickExact(text) {
    const handle = await page.evaluateHandle((label) => {
        const nodes = Array.from(document.querySelectorAll('button, [role="button"], a, input[type="submit"]'));
        return (
            nodes.find((el) => {
                const raw =
                    el instanceof HTMLInputElement
                        ? el.value || el.getAttribute('aria-label') || ''
                        : el.textContent || '';
                return raw.replace(/\s+/g, ' ').trim() === label;
            }) ?? null
        );
    }, text);
    const el = handle.asElement();
    if (!el) {
        await handle.dispose();
        throw new Error(`clickExact: ${text} not found`);
    }
    await el.click();
}

try {
    await page.goto('https://hh.ru/account/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 2000));

    await page.click('[data-qa="account-type-card-APPLICANT"]');
    await page.click('[data-qa="submit-button"]').catch(() => clickExact('Дальше'));

    await page.waitForSelector('[data-qa^="credential-type-email"]', { visible: true });
    await page.click('[data-qa^="credential-type-email"]');

    await page.waitForSelector('[data-qa="applicant-login-input-email"]', { visible: true });
    await page.type('[data-qa="applicant-login-input-email"]', 'verify@example.com');

    // Prefer «Войти с паролем» (same screen as «Дальше»).
    const expanded = await page.$('[data-qa="expand-login-by-password"]');
    if (expanded) {
        await expanded.click();
    } else {
        await clickExact('Войти с паролем');
    }

    await page.waitForSelector(
        '[data-qa="applicant-login-input-password"], [data-qa="login-input-password"], input[type="password"]',
        { visible: true },
    );

    const found = await page.evaluate(() => ({
        url: location.href,
        emailGoneAfterExpand: !document.querySelector('[data-qa="applicant-login-input-email"]'),
        password: Boolean(
            document.querySelector(
                '[data-qa="applicant-login-input-password"], [data-qa="login-input-password"], input[type="password"]',
            ),
        ),
        submitQa: Boolean(document.querySelector('[data-qa="submit-button"], [data-qa="account-login-submit"]')),
        bodyHint: (document.body?.innerText || '').includes('Введите пароль'),
        hasVoiti: Array.from(document.querySelectorAll('button, [role="button"]')).some(
            (el) => (el.textContent || '').replace(/\s+/g, ' ').trim() === 'Войти',
        ),
    }));
    console.log(JSON.stringify(found, null, 2));
    if (!found.password || !found.bodyHint) {
        process.exitCode = 1;
    }
} finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
}
