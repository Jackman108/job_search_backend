/** Env / flags for vacancies (per-user tables until S4). */
export const vacanciesConfig = {
    tableSuffix: 'vacancy' as const,
};

export function validateVacanciesConfig(): void {
    // No required env — placeholder for module config gate.
}

/** Quoted per-user vacancy table ident (legacy naming until S4). */
export function vacancyTableIdent(userId: string): string {
    return `"${userId}_${vacanciesConfig.tableSuffix}"`;
}
