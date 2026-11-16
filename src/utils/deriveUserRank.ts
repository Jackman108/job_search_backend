export type UserRankId = 'novice' | 'seeker' | 'hunter' | 'tracker' | 'master';

export type UserRank = {
    id: UserRankId;
    level: number;
    title: string;
    /** Progress 0–100 toward next rank (100 at max). */
    progressPct: number;
    nextTitle: string | null;
    nextSuccessfulResponses: number | null;
};

const TIERS: Array<{ id: UserRankId; title: string; minSuccess: number }> = [
    { id: 'novice', title: 'Новичок', minSuccess: 0 },
    { id: 'seeker', title: 'Искатель', minSuccess: 5 },
    { id: 'hunter', title: 'Охотник', minSuccess: 25 },
    { id: 'tracker', title: 'Следопыт', minSuccess: 75 },
    { id: 'master', title: 'Мастер охоты', minSuccess: 200 },
];

/** Rank from successful HH responses (primary) with a small spin bonus for early tiers. */
export function deriveUserRank(successfulResponses: number, spinCount: number): UserRank {
    const success = Math.max(0, Number(successfulResponses) || 0);
    const spins = Math.max(0, Number(spinCount) || 0);
    // Early boost: every 3 spins counts as +1 toward the first two tiers only.
    const effective = success + Math.min(Math.floor(spins / 3), 8);

    let idx = 0;
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (effective >= TIERS[i].minSuccess) {
            idx = i;
            break;
        }
    }

    const current = TIERS[idx];
    const next = TIERS[idx + 1] ?? null;
    let progressPct = 100;
    if (next) {
        const span = next.minSuccess - current.minSuccess;
        const done = effective - current.minSuccess;
        progressPct = Math.max(0, Math.min(99, Math.floor((done / span) * 100)));
    }

    return {
        id: current.id,
        level: idx + 1,
        title: current.title,
        progressPct,
        nextTitle: next?.title ?? null,
        nextSuccessfulResponses: next?.minSuccess ?? null,
    };
}
