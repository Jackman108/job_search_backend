/** Env for search-profile (HH credentials encryption key is platform-level `HH_CRED_KEY`). */
export const searchProfileConfig = {
    tables: ['vacancy_auth', 'vacancy_submit'] as const,
};

export function validateSearchProfileConfig(): void {
    // HH_CRED_KEY validated at boot via platform resolveHhCredKey().
}
