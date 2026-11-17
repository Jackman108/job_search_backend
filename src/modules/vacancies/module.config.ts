/** Shared vacancies table (S4). */
export const vacanciesConfig = {
    table: 'vacancies' as const,
};

export function validateVacanciesConfig(): void {
    // No required env — placeholder for module config gate.
}

/** Quoted shared vacancies table ident. */
export function vacancyTableIdent(): string {
    return vacanciesConfig.table;
}
