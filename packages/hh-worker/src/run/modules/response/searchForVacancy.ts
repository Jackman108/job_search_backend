import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@config';
import { stage } from '../../helpers/stageLog.js';

/** Magritte may rename search control — keep data-qa primary + common fallbacks. */
const SEARCH_INPUT_SELECTORS = [
    SELECTORS.VACANCY_INPUT,
    '[data-qa="search-input"]',
    'input[name="text"]',
    'input[data-qa*="search"]',
    'input[placeholder*="Должность"]',
    'input[placeholder*="Профессия"]',
].join(', ');

interface SearchForVacancyParams {
    page: Page;
    position: string;
    /** After login we are rarely still on the SERP — reopen this URL first. */
    vacancyUrl?: string;
}

/** Returns the live SERP URL after search results render. */
export async function searchForVacancy({ page, position, vacancyUrl }: SearchForVacancyParams): Promise<string> {
    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));

    try {
        let input = await page.$(SEARCH_INPUT_SELECTORS).catch(() => null);
        if (!input && vacancyUrl) {
            stage('search goto', vacancyUrl.slice(0, 80));
            await page.goto(vacancyUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });
            await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT * 2));
        }

        const vacancyInputSelector = await page.waitForSelector(SEARCH_INPUT_SELECTORS, {
            timeout: TIMEOUTS.MODAL,
            visible: true,
        });

        if (!vacancyInputSelector) {
            throw new Error('HH search input not found');
        }

        await vacancyInputSelector.click({ clickCount: 3 }).catch(() => undefined);
        await vacancyInputSelector.type(position);
        await page.keyboard.press('Enter');
        stage('search submitted', position);

        await Promise.race([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(() => null),
            page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG }).catch(() => null),
        ]);

        const cards = await page.waitForSelector(SELECTORS.VACANCY_CARD, { timeout: TIMEOUTS.LONG }).catch(() => null);
        if (!cards) {
            throw new Error('HH search returned no vacancy cards');
        }

        await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));
        const serpUrl = page.url();
        stage('search ready', serpUrl.slice(0, 100));
        return serpUrl;
    } catch (error) {
        console.error('Error when searching for a vacancy:', error);
        await page.screenshot({ path: 'screenshot-search-fail.png' }).catch(() => null);
        throw error;
    }
}
