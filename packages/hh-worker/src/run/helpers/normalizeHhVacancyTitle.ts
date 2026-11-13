const PLACEHOLDER = /^заголовок не найден$/i;

/**
 * Normalize HH vacancy title from SERP / H1 / og:title / document.title.
 * Strips common «Вакансия … в городе, работа в компании …» wrappers.
 */
export function normalizeHhVacancyTitle(raw: string | null | undefined): string {
    let title = String(raw || '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!title || PLACEHOLDER.test(title)) return '';

    title = title.replace(/^Вакансия\s+/i, '');
    title = title.replace(/\s+в\s+.+?,\s*работа\s+в\s+компании\s+.+$/i, '');
    title = title.replace(/\s+[—–-]\s*(работа|HeadHunter|hh\.ru).*$/i, '');
    title = title.replace(/\s+/g, ' ').trim();

    if (!title || PLACEHOLDER.test(title)) return '';
    // Blocked / soft-404 HH shells often leave a bare brand title.
    if (/^(headhunter|hh\.ru|работа\s+в\s+headhunter)$/i.test(title)) return '';
    return title.slice(0, 240);
}
