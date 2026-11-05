/**
 * HH vacancy-apply pacing (rate-limit / backoff sketch).
 *
 * Goal: space out Puppeteer отклики so the account is less likely to trip HH anti-bot.
 * Safe defaults are modestly slower than TIMEOUTS.SHORT (1s) but still short enough
 * that normal apply runs do not feel stuck. No worker extraction — call sites stay inline.
 *
 * Tune via constants below; keep values conservative. UI settle waits (modals, typing)
 * should keep using TIMEOUTS.* — this module is only for between-apply / between-page pacing.
 */

export const HH_RATE_LIMIT = {
    /** Base pause before each vacancy apply attempt (ms). */
    APPLY_BASE_MS: 2500,
    /** Extra random delay 0..N ms after apply base. */
    APPLY_JITTER_MS: 1500,
    /** Base pause after clicking pager-next (ms). */
    PAGE_BASE_MS: 2000,
    /** Extra random delay 0..N ms between SERP pages. */
    PAGE_JITTER_MS: 1000,
    /** Added per consecutive outer-loop apply failure (ms). */
    FAILURE_BACKOFF_STEP_MS: 2000,
    /** Cap on failure backoff so a bad page cannot stall forever. */
    FAILURE_BACKOFF_MAX_MS: 15000,
} as const;

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));
}

/** baseMs + uniform random in [0, jitterMs]. */
export function withJitter(baseMs: number, jitterMs: number): number {
    const span = Math.max(0, jitterMs);
    const jitter = span === 0 ? 0 : Math.floor(Math.random() * (span + 1));
    return Math.max(0, baseMs) + jitter;
}

/**
 * Pause before starting the next vacancy apply.
 * `consecutiveFailures` adds stepped backoff (capped) after outer-loop errors.
 * @returns actual wait in ms (for logs / tests)
 */
export async function delayBeforeApply(consecutiveFailures = 0): Promise<number> {
    const backoff = Math.min(
        Math.max(0, consecutiveFailures) * HH_RATE_LIMIT.FAILURE_BACKOFF_STEP_MS,
        HH_RATE_LIMIT.FAILURE_BACKOFF_MAX_MS
    );
    const ms = withJitter(HH_RATE_LIMIT.APPLY_BASE_MS + backoff, HH_RATE_LIMIT.APPLY_JITTER_MS);
    await sleep(ms);
    return ms;
}

/**
 * Pause after navigating to the next SERP page.
 * @returns actual wait in ms
 */
export async function delayBetweenPages(): Promise<number> {
    const ms = withJitter(HH_RATE_LIMIT.PAGE_BASE_MS, HH_RATE_LIMIT.PAGE_JITTER_MS);
    await sleep(ms);
    return ms;
}
