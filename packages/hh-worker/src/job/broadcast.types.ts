/**
 * Narrow port so claim/run loop stays free of API `@server` broadcast.
 * Detached workers: implementation is process-local until a real broker.
 */
export interface JobBroadcast {
    broadcast(message: string): void;
}
