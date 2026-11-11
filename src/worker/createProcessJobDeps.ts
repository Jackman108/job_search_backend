import type { ProcessJobDeps } from '@market-hunter/hh-worker/job';
import { broadcast } from '@server';
import {
    getChatFeedback,
    getVacanciesUser,
    incrementSpinCount,
    saveChatFeedback,
    saveVacancy,
    updateSuccessfulResponsesCount,
} from '@services';

/**
 * API composition root: wire `@services` counters/persistence + `@server` broadcast
 * into hh-worker ports. Loaded by package CLI (`HH_WORKER_DEPS_FACTORY` override).
 * Scenarios must not import `@services` / `@server` directly.
 */
export function createProcessJobDeps(): ProcessJobDeps {
    return {
        counters: {
            incrementSpinCount,
            updateSuccessfulResponsesCount,
        },
        broadcast: {
            broadcast,
        },
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
