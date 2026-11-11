import { Response } from 'express';
import { handleErrors } from '@middlewares';
import { stop } from '@utils';
import {
    AuthenticatedRequest,
    HhJobQueuedResponse,
    HhJobStatusResponse,
    RefreshScriptBody,
    StartScriptBody,
    StopScriptResponse,
} from '@interface';
import { cancelJobsForUser } from '../../worker/cancelJobs.js';
import { queueGetFeedback, queueSendFeedback } from '../../worker/enqueue.js';
import { readJob } from '../../worker/jobStore.js';

export class ScriptController {
    async startScript(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password, position, message, vacancyUrl } = req.body as Partial<StartScriptBody>;
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
            };
            res.status(200).json(body);
        } catch (error) {
            handleErrors(res, error, 'Job status error.');
        }
    }
}
