import type { ProcessJobDeps } from '@market-hunter/hh-worker/job';
import {
    getChatFeedback,
    getVacanciesUser,
    getVacancyAuthByUserId,
    incrementSpinCount,
    saveChatFeedback,
    saveVacancy,
    updateSuccessfulResponsesCount,
    upsertResumeFromHh,
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
        resumeRepo: {
            upsertFromHh: upsertResumeFromHh,
        },
        credentialsRepo: {
            getDecryptedByUserId: async (userId, email) => {
                const rows = await getVacancyAuthByUserId(userId);
                if (!rows.length) return null;
                const match =
                    (email ? rows.find((r) => r.email === email && r.password) : undefined) ||
                    rows.find((r) => r.email && r.password) ||
                    rows[0];
                if (!match?.email || !match.password) return null;
                return { email: match.email, password: match.password };
            },
        },
    };
}
