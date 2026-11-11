import type { JobBroadcast } from '@market-hunter/hh-worker/job';
import { logger } from '@utils';

/**
 * Detached worker cannot reach the API process WebSocket server.
 * HH progress/status for clients is poll-only via GET /jobs/:jobId (+ refetch after settle).
 * Keep the port for scenario calls; log locally instead of pretending to WS-broadcast.
 */
export const noopJobBroadcast: JobBroadcast = {
    broadcast(message: string): void {
        logger.info(`[hh-worker] ${message}`);
    },
};
