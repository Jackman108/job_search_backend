import type { JobBroadcast } from './broadcast.types.js';
import type { JobCounters } from './counters.types.js';
import type { FeedbackRepo } from './feedbackRepo.types.js';
import type { VacancyRepo } from './vacancyRepo.types.js';

/** Injected ports for `processJob` — no API `@services` / `@server` imports. */
export interface ProcessJobDeps {
    counters: JobCounters;
    broadcast: JobBroadcast;
    vacancyRepo: VacancyRepo;
    feedbackRepo: FeedbackRepo;
}
