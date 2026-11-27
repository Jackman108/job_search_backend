import { Page } from 'puppeteer';
import { TIMEOUTS } from '@market-hunter/hh-worker/config';
import type { ChatListMeta } from './getChatListMeta.js';

/**
 * HH «Отклики» filters hold invitations/interviews that may not show as
 * «Собеседование» in the chatik sidebar (or sit outside the virtualized window).
 *
 * Note: page.evaluate must not use named function/const bindings — tsx keepNames
 * injects `__name(...)` which is undefined in the browser context.
 */
const INVITE_URLS = [
    'https://hh.ru/applicant/negotiations?state=INTERVIEW',
    'https://hh.ru/applicant/negotiations?status=interview',
    'https://hh.ru/applicant/negotiations?status=invitations',
    'https://hh.ru/applicant/negotiations?state=INVITATION',
];

type BrowserInviteRow = {
    chatId: number;
    href: string;
    title_vacancy: string;
    title_company: string;
    statusRaw: string;
    previewText: string;
};

export async function syncNegotiationsInvites(page: Page): Promise<ChatListMeta[]> {
    const found: ChatListMeta[] = [];
    const seen = new Set<number>();

    for (const url of INVITE_URLS) {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });
            await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT * 2));

            const rows = await page.evaluate(() => {
                const out: BrowserInviteRow[] = [];

                const anchors = Array.from(
                    document.querySelectorAll<HTMLAnchorElement>(
                        'a[href*="/chat/"], a[href*="chatik"], a[data-qa*="negotiations"], a[href*="/vacancy/"]',
                    ),
                );

                const cards = Array.from(
                    document.querySelectorAll<HTMLElement>(
                        '[data-qa*="negotiations"], [class*="negotiations"] [class*="card"], [data-qa*="topic"]',
                    ),
                );

                const roots: ParentNode[] = cards.length
                    ? cards
                    : anchors
                          .map((a) => a.closest('div, li, article, tr') || a.parentElement)
                          .filter((n): n is HTMLElement => Boolean(n));

                for (const root of roots) {
                    const text = ((root as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim();
                    if (!text) continue;

                    const chatHref =
                        (root as HTMLElement).querySelector?.('a[href*="/chat/"]')?.getAttribute('href') ||
                        text.match(/https?:\/\/chatik\.hh\.ru\/chat\/\d+/)?.[0] ||
                        '';
                    const chatId = Number(String(chatHref).match(/\/chat\/(\d+)/)?.[1]) || 0;

                    const vacHref =
                        (root as HTMLElement).querySelector?.('a[href*="/vacancy/"]')?.getAttribute('href') || '';
                    const vacTitleEl = (root as HTMLElement).querySelector?.(
                        'a[href*="/vacancy/"], [data-qa*="vacancy"]',
                    ) as HTMLElement | null;
                    let title = (vacTitleEl?.innerText || '').trim();
                    if (!title) {
                        title = text.split(' ').slice(0, 8).join(' ');
                    }

                    const companyEl = (root as HTMLElement).querySelector?.(
                        '[data-qa*="company"], [class*="company"], a[href*="/employer/"]',
                    ) as HTMLElement | null;
                    const company = (companyEl?.innerText || '').trim();

                    const looksInvite = /собеседован|приглаш|интервью|interview|invitation/i.test(text);
                    if (!looksInvite && !chatId) continue;

                    out.push({
                        chatId,
                        href: chatHref
                            ? chatHref.startsWith('http')
                                ? chatHref
                                : `https://chatik.hh.ru${chatHref}`
                            : chatId
                              ? `https://chatik.hh.ru/chat/${chatId}`
                              : vacHref || '',
                        title_vacancy: title,
                        title_company: company,
                        statusRaw: 'Собеседование',
                        previewText: text.slice(0, 500),
                    });
                }

                return out;
            });

            for (const row of rows) {
                const key = row.chatId || 0;
                if (key) {
                    if (seen.has(key)) continue;
                    seen.add(key);
                }
                found.push(row);
            }
            console.log(`Negotiations invite pass ${url} → ${rows.length} cards`);
        } catch (err) {
            console.error(`Negotiations invite scrape failed for ${url}:`, err);
        }
    }

    return found;
}
