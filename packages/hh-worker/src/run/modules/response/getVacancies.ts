import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { VacancyWithResponse } from '@interface';
import { extractVacancyData } from '@utils';

/**
 * Collect applyable SERP cards. Does not keep ElementHandles — Magritte re-renders
 * and stale handles cause «Node is detached from document».
 */
export async function getVacancies(page: Page): Promise<VacancyWithResponse[]> {
    try {
        await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG });
        const rows = await page.evaluate((selectors) => {
            const cards = Array.from(document.querySelectorAll(selectors.VACANCY_CARD));
            return cards.map((card) => {
                const linkEl =
                    (card.querySelector('[data-qa="serp-item__title"]') as HTMLAnchorElement | null) ||
                    (card.querySelector('a[href*="/vacancy/"]') as HTMLAnchorElement | null);
                const titleEl = card.querySelector(selectors.VACANCY_TITLE) as HTMLElement | null;
                const titleFromLink = (linkEl?.innerText || linkEl?.getAttribute('title') || '').trim();
                const responseEl = card.querySelector(selectors.VACANCY_RESPONSE) as HTMLElement | null;
                // Prefer data-qa response control — loose text match inflated applyable counts (50).
                const responseByText = Array.from(card.querySelectorAll('a, button')).find((el) => {
                    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
                    return t === 'Откликнуться' || /^Откликнуться\b/i.test(t);
                });
                const companyEl = card.querySelector(selectors.COMPANY_LINK) as HTMLAnchorElement | null;
                return {
                    title_vacancy: (titleEl?.innerText || titleFromLink || '').trim(),
                    url_vacancy: linkEl?.href || '',
                    responseText: responseEl?.textContent || responseByText?.textContent || '',
                    title_company: companyEl?.textContent?.trim() || 'Компания не указана',
                    url_company: companyEl?.href || '#',
                };
            });
        }, SELECTORS);

        const vacanciesWithResponse: VacancyWithResponse[] = [];
        const visitedIds = new Set<number>();

        for (const row of rows) {
            if (!row.responseText?.includes('Откликнуться') || !row.url_vacancy) continue;
            const data = await extractVacancyData({
                title_vacancy: row.title_vacancy,
                url_vacancy: row.url_vacancy,
                title_company: row.title_company,
                url_company: row.url_company,
            });
            // Normalize — callers keep a numeric Set of already-processed ids.
            const id = Number(data.id);
            if (!Number.isFinite(id) || id <= 0 || visitedIds.has(id)) continue;
            data.id = id;
            visitedIds.add(id);
            vacanciesWithResponse.push({ data, vacancyResponse: null });
        }

        return vacanciesWithResponse;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error during job processing:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
}
