import fs from 'fs';
import { Response } from 'express';
import { handleErrors } from '@middlewares';
import { stop } from '@utils';
import {
    AuthenticatedRequest,
    CaptchaAnswerBody,
    HhJobQueuedResponse,
    HhJobStatusResponse,
    RefreshScriptBody,
    StartScriptBody,
    StopScriptResponse,
} from '@interface';
import { cancelJobsForUser } from '../../worker/cancelJobs.js';
import { queueGetFeedback, queueSendFeedback } from '../../worker/enqueue.js';
import { listJobs, readJob, updateJob, writeCaptchaAnswer } from '../../worker/jobStore.js';

export class ScriptController {
    async startScript(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password, position, message, vacancyUrl, dryRun, applyCap } =
                req.body as Partial<StartScriptBody>;
            if (!email || !password || !position || !message || !vacancyUrl) {
                res.status(400).json({
                    message: 'Required: email, password, position, message, vacancyUrl (from form).',
                });
                return;
            }
            const payload = {
                userId: req.userId!,
                email,
                password,
                position,
                message,
                vacancyUrl,
                dryRun: dryRun === true,
                applyCap: typeof applyCap === 'number' && applyCap > 0 ? Math.floor(applyCap) : undefined,
            };

            const { jobId } = queueSendFeedback(payload);
            // Counters update when the detached worker finishes successfully.
            const body: HhJobQueuedResponse = {
                message: 'HH apply job queued (detached worker).',
                jobId,
                mode: 'queue',
            };
            res.status(202).json(body);
        } catch (error) {
            handleErrors(res, error, 'Script execution error.');
        }
    }

    async stopScript(req: AuthenticatedRequest, res: Response) {
        try {
            const { cancelledJobIds, abortedJobIds } = cancelJobsForUser(req.userId!);
            await stop(req.body?.browser);
            const body: StopScriptResponse = {
                message: 'Script stopped successfully!',
                cancelledJobIds,
                cancelledCount: cancelledJobIds.length,
                abortedJobIds,
                abortedCount: abortedJobIds.length,
            };
            res.status(200).json(body);
        } catch (error) {
            handleErrors(res, error, 'Script stop error.');
        }
    }

    async refreshData(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password } = req.body as Partial<RefreshScriptBody>;
            if (!email || !password) {
                res.status(400).json({ message: 'Required: email, password (from form).' });
                return;
            }
            const payload = {
                userId: req.userId!,
                email,
                password,
            };

            const { jobId } = queueGetFeedback(payload);
            const body: HhJobQueuedResponse = {
                message: 'HH feedback refresh queued (detached worker).',
                jobId,
                mode: 'queue',
            };
            res.status(202).json(body);
        } catch (error) {
            handleErrors(res, error, 'Error Update!');
        }
    }

    /** Recent HH jobs for this user (no credentials). */
    async listJobs(req: AuthenticatedRequest, res: Response) {
        try {
            const limitRaw = Number(req.query.limit);
            const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.floor(limitRaw))) : 20;
            const jobs = listJobs()
                .filter((job) => job.userId === req.userId)
                .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
                .slice(0, limit)
                .map((job) => ({
                    id: job.id,
                    kind: job.kind,
                    status: job.status,
                    createdAt: job.createdAt,
                    startedAt: job.startedAt,
                    finishedAt: job.finishedAt,
                    error: job.error,
                    lastEvent: job.lastEvent,
                    summary: job.summary,
                }));
            res.status(200).json(jobs);
        } catch (error) {
            handleErrors(res, error, 'Job list error.');
        }
    }

    /** Ask waiting worker to Magritte-refresh CAPTCHA picture. */
    async requestCaptchaRefresh(req: AuthenticatedRequest, res: Response) {
        try {
            const jobId = req.params.jobId;
            const job = readJob(jobId);
            if (!job) {
                res.status(404).json({ message: 'Job not found.' });
                return;
            }
            if (job.userId !== req.userId) {
                res.status(403).json({ message: 'Forbidden.' });
                return;
            }
            if (!job.awaitingCaptcha || job.status !== 'running') {
                res.status(409).json({ message: 'Job is not awaiting CAPTCHA.' });
                return;
            }
            updateJob(jobId, {
                captchaRefreshRequested: true,
                lastEvent: 'CAPTCHA refresh requested',
                lastEventAt: new Date().toISOString(),
            });
            res.status(200).json({ message: 'CAPTCHA refresh requested.', jobId });
        } catch (error) {
            handleErrors(res, error, 'CAPTCHA refresh error.');
        }
    }

    async getJobStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const jobId = req.params.jobId;
            const job = readJob(jobId);
            if (!job) {
                res.status(404).json({ message: 'Job not found.' });
                return;
            }
            if (job.userId !== req.userId) {
                res.status(403).json({ message: 'Forbidden.' });
                return;
            }
            const hasCaptchaImage = Boolean(
                job.captchaImagePath &&
                fs.existsSync(job.captchaImagePath) &&
                fs.statSync(job.captchaImagePath).size > 32,
            );
            const body: HhJobStatusResponse = {
                id: job.id,
                kind: job.kind,
                status: job.status,
                createdAt: job.createdAt,
                startedAt: job.startedAt,
                finishedAt: job.finishedAt,
                error: job.error,
                countersUpdated: job.countersUpdated === true,
                lastEvent: job.lastEvent,
                lastEventAt: job.lastEventAt,
                captchaSrc: job.captchaSrc,
                hasCaptchaImage,
                awaitingCaptcha: job.awaitingCaptcha === true,
                summary: job.summary,
            };
            res.status(200).json(body);
        } catch (error) {
            handleErrors(res, error, 'Job status error.');
        }
    }

    /** Serve worker-captured CAPTCHA PNG (HH picture URL is often unusable cross-origin). */
    async getCaptchaImage(req: AuthenticatedRequest, res: Response) {
        try {
            const job = readJob(req.params.jobId);
            if (!job) {
                res.status(404).json({ message: 'Job not found.' });
                return;
            }
            if (job.userId !== req.userId) {
                res.status(403).json({ message: 'Forbidden.' });
                return;
            }
            const filePath = job.captchaImagePath;
            if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).size < 32) {
                res.status(404).json({ message: 'CAPTCHA image not ready.' });
                return;
            }
            res.setHeader('Cache-Control', 'no-store');
            res.type('png');
            fs.createReadStream(filePath).pipe(res);
        } catch (error) {
            handleErrors(res, error, 'CAPTCHA image error.');
        }
    }

    /** Headless CAPTCHA solve: write answer for the waiting worker to type. */
    async submitCaptchaAnswer(req: AuthenticatedRequest, res: Response) {
        try {
            const jobId = req.params.jobId;
            const { answer } = req.body as Partial<CaptchaAnswerBody>;
            const trimmed = typeof answer === 'string' ? answer.trim() : '';
            if (!trimmed) {
                res.status(400).json({ message: 'Required: answer (captcha text).' });
                return;
            }

            const job = readJob(jobId);
            if (!job) {
                res.status(404).json({ message: 'Job not found.' });
                return;
            }
            if (job.userId !== req.userId) {
                res.status(403).json({ message: 'Forbidden.' });
                return;
            }
            if (job.status !== 'running') {
                res.status(409).json({ message: `Job is not running (status=${job.status}).` });
                return;
            }
            if (!job.awaitingCaptcha) {
                res.status(409).json({ message: 'Job is not awaiting a CAPTCHA answer.' });
                return;
            }

            // Side-channel file avoids JSON RMW races with the worker poll loop.
            writeCaptchaAnswer(jobId, trimmed);
            updateJob(jobId, {
                captchaAnswer: trimmed,
                lastEvent: 'CAPTCHA answer submitted',
                lastEventAt: new Date().toISOString(),
            });
            res.status(200).json({ message: 'CAPTCHA answer accepted.', jobId });
        } catch (error) {
            handleErrors(res, error, 'CAPTCHA answer error.');
        }
    }
}
