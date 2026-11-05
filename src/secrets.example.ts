/**
 * Copy to src/secrets.ts (gitignored) and fill real values.
 * Never commit secrets.ts — it is tracked historically; rotate credentials if exposed.
 */
export const personalData = {
    vacanciesUrl: 'https://hh.ru/search/vacancy?...',
    vacancySearch: 'Job title to search',
    coverLetter: `Cover letter text`,
    vacancyEmail: 'your_hh_email@example.com',
    vacancyPassword: 'your_hh_password',
    totalPages: 3,
};
