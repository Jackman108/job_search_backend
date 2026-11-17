import { getFeedback } from '../run/getFeedback.js';
import { sendFeedback } from '../run/sendFeedback.js';
import { syncResume } from '../run/syncResume.js';
import type { CredentialsRepo } from './credentialsRepo.types.js';
import { createJobStoreBroadcast } from './jobStoreBroadcast.js';
import type { ProcessJobDeps } from './processJob.deps.js';
import { claimQueuedJob, readJob, updateJob } from './store.js';

type CredPayload = { userId: string; email: string; password: string };

/** Fill password from DB when job file was redacted (S2). */
async function resolvePayloadCredentials<T extends CredPayload>(
    payload: T,
    credentialsRepo: CredentialsRepo,
): Promise<T> {
    if (typeof payload.password === 'string' && payload.password.trim()) {
        return payload;
    }
    const creds = await credentialsRepo.getDecryptedByUserId(payload.userId, payload.email);
    if (!creds?.password) {
        throw new Error(
            'HH credentials missing for job (not on disk by design). Save login/password on Отправка заявок and retry.',
        );
    }
    return {
        ...payload,
        email: payload.email?.trim() ? payload.email : creds.email,
        password: creds.password,
    };
}

/**
 * Claim a queued HH job and run the matching scenario.
 * Counters, broadcast, and persistence are injected — package must not import API internals.
 * Broadcast is wrapped so CAPTCHA/errors land on the job file for GET /jobs/:id poll.
 */
export async function processJob(id: string, deps: ProcessJobDeps): Promise<void> {
    const { counters } = deps;
    const job = claimQueuedJob(id);
    if (!job) {
        const existing = readJob(id);
        if (!existing || existing.status === 'cancelled') {
            return;
        }
        throw new Error(`job ${id} is not queued (status=${existing.status})`);
    }

    const broadcast = createJobStoreBroadcast(id, deps.broadcast);

    try {
        if (job.kind === 'sendFeedback') {
            const payload = await resolvePayloadCredentials(job.payload, deps.credentialsRepo);
            const vacancyRepo = {
                ...deps.vacancyRepo,
                saveVacancy: async (data: Parameters<typeof deps.vacancyRepo.saveVacancy>[0], userId: string) => {
                    await deps.vacancyRepo.saveVacancy(data, userId);
                    updateJob(id, {
                        lastEvent: `Vacancy saved ${data.id}`,
                        lastEventAt: new Date().toISOString(),
                    });
                },
            };
            await sendFeedback(payload, {
                vacancyRepo,
                broadcast,
                jobId: id,
            });
            await counters.incrementSpinCount(job.userId);
            await counters.updateSuccessfulResponsesCount(job.userId);
            if (readJob(id)?.status === 'cancelled') {
                return;
            }
            const finished = readJob(id);
            updateJob(id, {
                status: 'done',
                finishedAt: new Date().toISOString(),
                countersUpdated: true,
                lastEvent: finished?.lastEvent || `HH job ${id} done (sendFeedback)`,
                lastEventAt: finished?.lastEventAt || new Date().toISOString(),
                summary: finished?.summary,
            });
            broadcast.broadcast(finished?.lastEvent || `HH job ${id} done (sendFeedback)`);
        } else if (job.kind === 'getFeedback') {
            const payload = await resolvePayloadCredentials(job.payload, deps.credentialsRepo);
            const feedbackRepo = {
                ...deps.feedbackRepo,
                saveChatFeedback: async (
                    data: Parameters<typeof deps.feedbackRepo.saveChatFeedback>[0],
                    userId: string,
                ) => {
                    await deps.feedbackRepo.saveChatFeedback(data, userId);
                    updateJob(id, {
                        lastEvent: `Feedback saved ${data.id} · ${data.response_status}`,
                        lastEventAt: new Date().toISOString(),
                    });
                },
            };
            await getFeedback(payload, {
                feedbackRepo,
                broadcast,
                jobId: id,
            });
            if (readJob(id)?.status === 'cancelled') {
                return;
            }
            const finished = readJob(id);
            updateJob(id, {
                status: 'done',
                finishedAt: new Date().toISOString(),
                lastEvent: finished?.lastEvent || `HH job ${id} done (getFeedback)`,
                lastEventAt: new Date().toISOString(),
            });
            broadcast.broadcast(finished?.lastEvent || `HH job ${id} done (getFeedback)`);
        } else {
            const payload = await resolvePayloadCredentials(job.payload, deps.credentialsRepo);
            await syncResume(payload, {
                resumeRepo: deps.resumeRepo,
                broadcast,
                jobId: id,
            });
            if (readJob(id)?.status === 'cancelled') {
                return;
            }
            const finished = readJob(id);
            updateJob(id, {
                status: 'done',
                finishedAt: new Date().toISOString(),
                lastEvent: finished?.lastEvent || `HH job ${id} done (syncResume)`,
                lastEventAt: new Date().toISOString(),
            });
            broadcast.broadcast(finished?.lastEvent || `HH job ${id} done (syncResume)`);
        }
    } catch (err) {
        if (readJob(id)?.status === 'cancelled') {
            return;
        }
        const message = err instanceof Error ? err.message : String(err);
        updateJob(id, {
            status: 'error',
            finishedAt: new Date().toISOString(),
            error: message,
            lastEvent: message,
            lastEventAt: new Date().toISOString(),
        });
        broadcast.broadcast(`HH job ${id} error: ${message}`);
        throw err;
    }
}
