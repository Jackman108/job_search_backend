/**
 * Normalize HH chat-bubble title text into our feedback status labels.
 * Prefer invite/reject over generic "viewed" / unknown.
 */
export function mapFeedbackStatus(raw: string | undefined | null): string {
    const text = (raw || '').trim();
    if (!text) return 'Не рассмотрен';

    const lower = text.toLowerCase();
    if (/отказ/.test(lower)) return 'Отказ';
    // "Приглашение" / "пригласили" — different stems (ш vs с).
    if (/приглаш|приглас|собеседован|интервью|invite|interview/.test(lower)) return 'Приглашение';
    if (/просмотр/.test(lower)) return 'Резюме просмотрено';
    return 'Не рассмотрен';
}

/** Pick the strongest status among several bubble titles in one chat. */
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
