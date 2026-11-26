/**
 * Normalize HH chat-list / bubble / letter status text into our feedback labels.
 *
 * Pipeline (one vacancy, latest wins by rank):
 *   Не рассмотрен → Резюме просмотрено → Приглашение → Отказ | Вакансия в архиве
 *
 * Reject letters often contain «не готовы пригласить» — must not map to Приглашение.
 * When both reject and invite signals appear, Отказ wins (final state).
 */
export function mapFeedbackStatus(raw: string | undefined | null): string {
    const text = (raw || '').trim();
    if (!text) return 'Не рассмотрен';

    const lower = text.toLowerCase();

    // Explicit reject (list label, state id, or HR letter phrasing).
    if (
        /отказ|discard/.test(lower) ||
        /к\s+сожалению/.test(lower) ||
        /не\s+готов[аы]?\s+приглас/.test(lower) ||
        /не\s+приглас/.test(lower) ||
        /вынужден[аы]?\s+отказать|выбрали\s+другого|не\s+продолжаем\s+общение|отказать\s+в\s+трудоустройств/.test(lower)
    ) {
        return 'Отказ';
    }

    // Vacancy closed / archived on HH — terminal for the applicant thread.
    if (
        /ваканси[яи]\s+в\s+архиве|в\s+архиве|архивн|недоступн|снят[ао]?\s+с\s+публикац|vacancy\s+(is\s+)?archiv/.test(
            lower,
        )
    ) {
        return 'Вакансия в архиве';
    }

    // Invite / interview — use «приглашен/пригласил», not bare «приглас» (matches «пригласить» in rejects).
    if (
        /приглашен|пригласил|собеседован|интервью|\binvite\b|\binterview\b|\binvitation\b/.test(lower) ||
        /будем\s+рады\s+видеть|удобно\s+(ли\s+)?созвон|назначить\s+собеседован/.test(lower)
    ) {
        return 'Приглашение';
    }

    if (/просмотр|viewed/.test(lower)) return 'Резюме просмотрено';
    if (/отклик\s+на\s+вакансию|на\s+рассмотрен|не\s*рассмотрен|^response$|^отклик$/.test(lower)) {
        return 'Не рассмотрен';
    }
    return 'Не рассмотрен';
}

/** Prefer final reject/archive over invite when signals conflict. */
export function pickBestFeedbackStatus(rawTitles: string[]): string {
    if (!rawTitles.length) return 'Не рассмотрен';
    const mapped = rawTitles.map(mapFeedbackStatus);
    const rank = (s: string): number => {
        if (s === 'Отказ') return 0;
        if (s === 'Вакансия в архиве') return 1;
        if (s === 'Приглашение') return 2;
        if (s === 'Резюме просмотрено') return 3;
        return 4;
    };
    return mapped.reduce((best, cur) => (rank(cur) < rank(best) ? cur : best));
}
