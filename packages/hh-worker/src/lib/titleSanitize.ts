/** Magritte vacancy header CTA — never persist as vacancy title. */
const BAD_TITLES = /^(перейти|открыть|смотреть|подробнее|vacancy|вакансия)$/i;

export function sanitizeVacancyTitle(raw: string | undefined | null): string {
    const t = (raw || '').replace(/\s+/g, ' ').trim();
    if (!t || BAD_TITLES.test(t)) return '';
    return t;
}
