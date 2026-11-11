import type { JobBroadcast } from './broadcast.types.js';
import type { JobCounters } from './counters.types.js';

/** Injected ports for `processJob` — no API `@services` / `@server` imports. */
export interface ProcessJobDeps {
    counters: JobCounters;
    broadcast: JobBroadcast;
}
