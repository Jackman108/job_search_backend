/**
 * Normalize HH chat-list / bubble status text into our feedback labels.
 * Prefer invite/reject over generic "viewed" / response / unknown.
 */
export function mapFeedbackStatus(raw: string | undefined | null): string {
    const text = (raw || '').trim();
    if (!text) return 'Не рассмотрен';

    const lower = text.toLowerCase();
    if (/отказ|discard/.test(lower)) return 'Отказ';
    // Labels + common HR letter stems + chat_data applicant_state ids
    if (
        /приглаш|приглас|собеседован|интервью|invite|interview|invitation/.test(lower) ||
        /будем\s+рады\s+видеть|удобно\s+(ли\s+)?созвон|назначить\s+собеседован/.test(lower)
    ) {
        return 'Приглашение';
    }
    if (/просмотр|viewed/.test(lower)) return 'Резюме просмотрено';
    // Magritte list label / state id for unanswered response
    if (/отклик\s+на\s+вакансию|не\s*рассмотрен|^response$/.test(lower)) return 'Не рассмотрен';
    return 'Не рассмотрен';
}

/** Pick the strongest status among several labels in one chat. */
export function pickBestFeedbackStatus(rawTitles: string[]): string {
    if (!rawTitles.length) return 'Не рассмотрен';
    const mapped = rawTitles.map(mapFeedbackStatus);
    const rank = (s: string): number => {
        if (s === 'Приглашение') return 0;
        if (s === 'Отказ') return 1;
        if (s === 'Резюме просмотрено') return 2;
        return 3;
    };
    return mapped.reduce((best, cur) => (rank(cur) < rank(best) ? cur : best));
}
