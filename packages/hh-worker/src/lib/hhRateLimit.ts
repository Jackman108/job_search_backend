/**
 * HH vacancy-apply pacing (between Puppeteer applies / SERP pages).
 * Lives in hh-jobs; `@utils` re-exports for worker until worker.config lands (phase 4b).
 */

export const HH_RATE_LIMIT = {
    APPLY_BASE_MS: 6500,
    APPLY_JITTER_MS: 1500,
    PAGE_BASE_MS: 3000,
    PAGE_JITTER_MS: 1500,
    FAILURE_BACKOFF_STEP_MS: 2500,
    FAILURE_BACKOFF_MAX_MS: 20000,
} as const;

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

/** baseMs + uniform random in [0, jitterMs]. */
export function withJitter(baseMs: number, jitterMs: number): number {
    const span = Math.max(0, jitterMs);
    const jitter = span === 0 ? 0 : Math.floor(Math.random() * (span + 1));
    return Math.max(0, baseMs) + jitter;
}

export async function delayBeforeApply(consecutiveFailures = 0): Promise<number> {
    const envPause = Number(process.env.HH_APPLY_PAUSE_MS);
    const base = Number.isFinite(envPause) && envPause >= 0 ? envPause : HH_RATE_LIMIT.APPLY_BASE_MS;
    const backoff = Math.min(
        Math.max(0, consecutiveFailures) * HH_RATE_LIMIT.FAILURE_BACKOFF_STEP_MS,
        HH_RATE_LIMIT.FAILURE_BACKOFF_MAX_MS,
    );
    const ms = withJitter(base + backoff, HH_RATE_LIMIT.APPLY_JITTER_MS);
    await sleep(ms);
    return ms;
}

export function readApplyCap(override?: number): number | undefined {
    if (typeof override === 'number' && override > 0) return Math.floor(override);
    const envCap = Number(process.env.HH_APPLY_CAP);
    if (Number.isFinite(envCap) && envCap > 0) return Math.floor(envCap);
    return undefined;
}

export async function delayBetweenPages(): Promise<number> {
    const ms = withJitter(HH_RATE_LIMIT.PAGE_BASE_MS, HH_RATE_LIMIT.PAGE_JITTER_MS);
    await sleep(ms);
    return ms;
}
