/** Re-export worker pacing SoT (S10 apply delays). */
export {
    HH_RATE_LIMIT,
    delayBeforeApply,
    delayBetweenPages,
    readApplyCap,
    sleep,
    withJitter,
} from '@market-hunter/hh-worker/lib';
