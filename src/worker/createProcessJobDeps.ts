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
 * into hh-worker ports (scenarios must not import `@services` directly).
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
