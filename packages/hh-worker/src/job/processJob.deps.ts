import type { JobBroadcast } from './broadcast.types.js';
import type { CredentialsRepo } from './credentialsRepo.types.js';
import type { JobCounters } from './counters.types.js';
import type { FeedbackRepo } from './feedbackRepo.types.js';
import type { ResumeRepo } from './resumeRepo.types.js';
import type { VacancyRepo } from './vacancyRepo.types.js';

/** Injected ports for `processJob` — no API `@services` / `@server` imports. */
export interface ProcessJobDeps {
    counters: JobCounters;
    broadcast: JobBroadcast;
    vacancyRepo: VacancyRepo;
    feedbackRepo: FeedbackRepo;
    resumeRepo: ResumeRepo;
    /** Required when job payload.password is empty (default after S2 redact-on-write). */
    credentialsRepo: CredentialsRepo;
}

/** Narrower slice for Puppeteer scenarios (repos + broadcast; no API imports). */
export type ScenarioDeps = Pick<ProcessJobDeps, 'vacancyRepo' | 'feedbackRepo' | 'resumeRepo' | 'broadcast'>;
