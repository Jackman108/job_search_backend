import { Page } from 'puppeteer';

/**
 * Magritte SERP header total («Найдено N вакансий»). Returns 0 when the copy is missing.
 */
export async function readSerpFoundCount(page: Page): Promise<number> {
    return page
        .evaluate(() => {
            const pick = (text: string): number => {
                const normalized = text
                    .replace(/\u00a0/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                const found = normalized.match(/найдено\s+(\d[\d\s]*)\s*ваканси/i);
                if (found) return Number(found[1].replace(/\s/g, '')) || 0;
                const generic = normalized.match(/(\d[\d\s]*)\s*ваканси/i);
                if (generic) return Number(generic[1].replace(/\s/g, '')) || 0;
                return 0;
            };

            const candidates = [
                document.querySelector('[data-qa="vacancies-total-found"]')?.textContent || '',
                document.querySelector('[data-qa="bloko-header-1"]')?.textContent || '',
                document.querySelector('h1')?.textContent || '',
                ...Array.from(document.querySelectorAll('[data-qa*="total"], [class*="total-found"]')).map(
                    (el) => el.textContent || '',
                ),
            ];

            for (const text of candidates) {
                const n = pick(text);
                if (n > 0) return n;
            }

            return pick(document.body?.innerText || '');
        })
        .catch(() => 0);
}
