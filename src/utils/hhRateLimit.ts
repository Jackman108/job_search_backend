/**
 * HH vacancy-apply pacing (rate-limit / backoff sketch).
 *
 * Goal: space out Puppeteer отклики so the account is less likely to trip HH anti-bot.
 * Live Magritte batch (2026-11-11) hit captcha when pacing was aggressive; ~6–8s between
 * applies is the working band. No worker extraction — call sites stay inline.
 *
 * Tune via constants below; keep values conservative. UI settle waits (modals, typing)
 * should keep using TIMEOUTS.* — this module is only for between-apply / between-page pacing.
 */

export const HH_RATE_LIMIT = {
    /** Base pause before each vacancy apply attempt (ms). ~6–8s band with jitter. */
    APPLY_BASE_MS: 6500,
    /** Extra random delay 0..N ms after apply base → typically 6.5–8s total. */
    APPLY_JITTER_MS: 1500,
    /** Base pause after clicking pager-next (ms). */
    PAGE_BASE_MS: 3000,
    /** Extra random delay 0..N ms between SERP pages. */
    PAGE_JITTER_MS: 1500,
    /** Added per consecutive outer-loop apply failure (ms). */
    FAILURE_BACKOFF_STEP_MS: 2500,
    /** Cap on failure backoff so a bad page cannot stall forever. */
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

/**
 * Pause before starting the next vacancy apply.
 * `consecutiveFailures` adds stepped backoff (capped) after outer-loop errors.
 * @returns actual wait in ms (for logs / tests)
 */
export async function delayBeforeApply(consecutiveFailures = 0): Promise<number> {
    const backoff = Math.min(
        Math.max(0, consecutiveFailures) * HH_RATE_LIMIT.FAILURE_BACKOFF_STEP_MS,
        HH_RATE_LIMIT.FAILURE_BACKOFF_MAX_MS,
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
