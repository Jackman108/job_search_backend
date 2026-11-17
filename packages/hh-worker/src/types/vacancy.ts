import type { ElementHandle } from 'puppeteer';

export interface VacancyData {
    id: number;
    title_vacancy: string;
    url_vacancy: string;
    title_company: string;
    url_company: string;
    vacancy_status: string;
    response_date: string;
    response_date_time?: string;
    response_date_date?: string;
}

export interface VacancyWithResponse {
    data: VacancyData;
    /** Deprecated: Magritte re-renders SERP — prefer click by vacancy id. */
    vacancyResponse?: ElementHandle | null;
}

export interface ExtractVacancyDataParams {
    title_vacancy: string;
    url_vacancy: string;
    title_company: string;
    url_company: string;
}
