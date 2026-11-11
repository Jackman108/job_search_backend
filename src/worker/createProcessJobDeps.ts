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
 * JobBroadcast logs locally (no cross-process WS). `processJob` wraps it with
 * `createJobStoreBroadcast` so CAPTCHA/errors persist on the job file for poll SoT.
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
