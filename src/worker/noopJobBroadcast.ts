import type { JobBroadcast } from '@market-hunter/hh-worker/job';
import { logger } from '@utils';

/**
 * Detached worker cannot reach the API process WebSocket server.
 * HH progress/status for clients is poll-only via GET /jobs/:jobId (+ refetch after settle).
 * `processJob` wraps this with `createJobStoreBroadcast` so CAPTCHA/errors hit the job file.
 */
export const noopJobBroadcast: JobBroadcast = {
    broadcast(message: string): void {
        logger.info(`[hh-worker] ${message}`);
    },
};
