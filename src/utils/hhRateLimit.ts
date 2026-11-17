/**
 * @deprecated Prefer `@market-hunter/hh-worker/lib` (worker) or `modules/hh-jobs` (API).
 * Single SoT for pacing is the worker package.
 */
export {
    HH_RATE_LIMIT,
    delayBeforeApply,
    delayBetweenPages,
    readApplyCap,
    sleep,
    withJitter,
} from '@market-hunter/hh-worker/lib';
