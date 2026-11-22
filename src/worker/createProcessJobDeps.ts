import type { ProcessJobDeps } from '@market-hunter/hh-worker/job';
import { getChatFeedback, saveChatFeedback } from '../modules/feedback/index.js';
import { incrementSpinCount, updateSuccessfulResponsesCount } from '../modules/profile/index.js';
import { upsertResumeFromHh } from '../modules/resume/index.js';
import { getVacancyAuthByUserId } from '../modules/search-profile/index.js';
import { getVacanciesUser, saveVacancy } from '../modules/vacancies/index.js';
import { noopJobBroadcast } from './noopJobBroadcast.js';

/**
 * API composition root: wire module ports + poll-only JobBroadcast into hh-worker.
 * Loaded by package CLI (`HH_WORKER_DEPS_FACTORY` override).
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
