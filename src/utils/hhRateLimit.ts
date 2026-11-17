/**
 * @deprecated Import from `src/modules/hh-jobs` (or worker config after phase 4b).
 * Re-export keeps worker `@utils` imports working until worker isolation lands.
 */
export {
    HH_RATE_LIMIT,
    delayBeforeApply,
    delayBetweenPages,
    readApplyCap,
    sleep,
    withJitter,
} from '../modules/hh-jobs/index.js';
