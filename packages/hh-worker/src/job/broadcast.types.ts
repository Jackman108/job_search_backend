/**
 * Narrow port so claim/run loop stays free of API `@server` broadcast.
 * Detached workers: adapter is WS-noop (log-only); clients poll GET /jobs/:jobId.
 * Live API WS is for in-process events only — not HH worker progress.
 */
export interface JobBroadcast {
    broadcast(message: string): void;
}
