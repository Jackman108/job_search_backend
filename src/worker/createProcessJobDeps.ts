import type { ProcessJobDeps } from '@market-hunter/hh-worker/job';
import {
    getChatFeedback,
    getVacanciesUser,
    incrementSpinCount,
    saveChatFeedback,
    saveVacancy,
    updateSuccessfulResponsesCount,
} from '@services';
import { noopJobBroadcast } from './noopJobBroadcast.js';

/**
 * API composition root: wire `@services` counters/persistence + poll-only JobBroadcast
 * into hh-worker ports. Loaded by package CLI (`HH_WORKER_DEPS_FACTORY` override).
 * Scenarios must not import `@services` / `@server` directly.
 *
 * JobBroadcast is intentionally a no-op for WS (logs only): detached worker has no
 * shared WS with the API. Source of truth = file job-store + GET /jobs/:jobId.
 */
export function createProcessJobDeps(): ProcessJobDeps {
    return {
        counters: {
            incrementSpinCount,
            updateSuccessfulResponsesCount,
        },
        broadcast: noopJobBroadcast,
        vacancyRepo: {
            saveVacancy,
            getVacanciesUser,
        },
        feedbackRepo: {
            saveChatFeedback,
            getChatFeedback,
        },
    };
}
