/**
 * Guest HH Magritte login dump (no credentials submitted).
 * Usage: node scripts/verify-hh-login.mjs
 * Headed debug: HH_HEADED=1 node scripts/verify-hh-login.mjs
 *            or PUPPETEER_HEADLESS=false node scripts/verify-hh-login.mjs
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
page.setDefaultTimeout(20000);

await page.goto('https://hh.ru/account/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));
await page.click('[data-qa="account-type-card-APPLICANT"]');
await page.click('[data-qa="submit-button"]');
await page.waitForSelector('[data-qa^="credential-type-email"]');
await page.click('[data-qa^="credential-type-email"]');
await page.waitForSelector('[data-qa="applicant-login-input-email"]');
await page.type('[data-qa="applicant-login-input-email"]', 'verify@example.com');
await page.click('[data-qa="expand-login-by-password"]');
await page.waitForSelector('[data-qa="applicant-login-input-password"], input[type="password"]', {
    visible: true,
});

const found = await page.evaluate(() => ({
    url: location.href,
    email: Boolean(document.querySelector('[data-qa="applicant-login-input-email"]')),
    password: Boolean(
        document.querySelector(
            '[data-qa="applicant-login-input-password"], [data-qa="login-input-password"], input[type="password"]',
        ),
    ),
    submit: Boolean(
        document.querySelector('[data-qa="submit-button"], [data-qa="account-login-submit"]'),
    ),
}));
console.log(JSON.stringify(found, null, 2));

await browser.close();
fs.rmSync(dir, { recursive: true, force: true });
