import type express from 'express';
import { validateHhJobsConfig } from './module.config.js';
import { registerHhJobRoutes } from './http/hhJob.routes.js';

export { HhJobController } from './http/HhJobController.js';
export { hhJobsConfig } from './module.config.js';
export {
    enqueueApply,
    enqueueFeedbackRefresh,
    enqueueResumeSync,
    listUserJobs,
    stopUserJobs,
} from './application/hhJobService.js';
export { resolveHhApplyCredentials, type HhApplyCredentials } from './application/resolveHhApplyCredentials.js';
export {
    HH_RATE_LIMIT,
    delayBeforeApply,
    delayBetweenPages,
    readApplyCap,
    sleep,
    withJitter,
} from './domain/hhRateLimit.js';
export { toPublicJobListItem, toPublicJobStatus } from './domain/publicJob.js';
export { hhEnqueueRateLimit, resetHhEnqueueRateLimit } from './http/hhEnqueueRateLimit.js';

/** Composition entry: validate config + mount HH job HTTP routes. */
export function register(app: express.Application): void {
    validateHhJobsConfig();
    registerHhJobRoutes(app);
}
