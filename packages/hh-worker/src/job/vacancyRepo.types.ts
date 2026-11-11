/**
 * Narrow port so apply scenarios stay free of API `@services` vacancy persistence.
 * Wired by the API composition root (`createProcessJobDeps`).
 */
export interface VacancySaveRecord {
    id: number;
    title_vacancy: string;
    url_vacancy: string;
    title_company: string;
    url_company: string;
    vacancy_status: string;
    response_date: string;
}

export interface VacancyRepo {
    saveVacancy(data: VacancySaveRecord, userId: string): Promise<void>;
    /** Rows used for apply dedupe — at least `id`. */
    getVacanciesUser(userId: string): Promise<Array<{ id: number }>>;
}
