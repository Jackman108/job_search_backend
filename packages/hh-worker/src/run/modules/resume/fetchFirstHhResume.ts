import type { Page } from 'puppeteer';
import { TIMEOUTS } from '@market-hunter/hh-worker/config';

/**
 * After HH login: take the first applicant resume (API preferred, DOM fallback for id).
 */
export async function fetchFirstHhResume(page: Page): Promise<Record<string, unknown>> {
    await page.goto('https://hh.ru/applicant/resumes', {
        waitUntil: 'domcontentloaded',
        timeout: Math.max(TIMEOUTS.LONG, 90_000),
    });
    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));

    const fromApi = await page.evaluate(async () => {
        const tryFetch = async (url: string) => {
            const res = await fetch(url, {
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) return null;
            return (await res.json()) as Record<string, unknown>;
        };

        const mine = await tryFetch('https://api.hh.ru/resumes/mine');
        if (mine && Array.isArray(mine.items) && mine.items.length > 0) {
            const first = mine.items[0] as { id?: string };
            if (first?.id) {
                const full = await tryFetch(`https://api.hh.ru/resumes/${first.id}`);
                if (full && typeof full === 'object') return full;
            }
            return mine.items[0] as Record<string, unknown>;
        }

        const card = document.querySelector('a[data-qa="resume-card-title"]') as HTMLAnchorElement | null;
        const anyResume = document.querySelector('a[href*="/resume/"]') as HTMLAnchorElement | null;
        const href = (card || anyResume)?.href || '';
        const m = href.match(/\/resume\/([^/?#]+)/);
        if (!m) return null;
        return tryFetch(`https://api.hh.ru/resumes/${m[1]}`);
    });

    if (fromApi && typeof fromApi === 'object') {
        return fromApi;
    }

    throw new Error('HH resume sync: no resumes found for this account (expected at least one).');
}
