// controllers/ScriptController.js
import { Response } from 'express';
import { getFeedback } from '@run';
import { sendFeedback } from '@run';
import { handleErrors } from '@middlewares';
import { incrementSpinCount, updateSuccessfulResponsesCount } from '@services';
import { stop } from '@utils';
import { AuthenticatedRequest } from '@interface';
import { queueGetFeedback, queueSendFeedback, useQueuedWorker } from '../../worker/enqueue.js';
import { readJob } from '../../worker/jobStore.js';

export class ScriptController {
    async startScript(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password, position, message, vacancyUrl } = req.body;
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

            if (useQueuedWorker()) {
                const { jobId } = queueSendFeedback(payload);
                // Counters update when the detached worker finishes successfully.
                res.status(202).json({
                    message: 'HH apply job queued (detached worker).',
                    jobId,
                    mode: 'queue',
                });
                return;
            }

            await sendFeedback(payload);
            await incrementSpinCount(req.userId!);
            await updateSuccessfulResponsesCount(req.userId!);
            res.status(200).json({ message: 'The script was executed successfully!', mode: 'sync' });
        } catch (error) {
            handleErrors(res, error, 'Script execution error.');
        }
    }

    async stopScript(req: AuthenticatedRequest, res: Response) {
        try {
            await stop(req.body.browser);
            res.status(200).json({ message: 'Script stopped successfully!' });
        } catch (error) {
            handleErrors(res, error, 'Script stop error.');
        }
    }

    async refreshData(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ message: 'Required: email, password (from form).' });
                return;
            }
            const payload = {
                userId: req.userId!,
                email,
                password,
            };

            if (useQueuedWorker()) {
                const { jobId } = queueGetFeedback(payload);
                res.status(202).json({
                    message: 'HH feedback refresh queued (detached worker).',
                    jobId,
                    mode: 'queue',
                });
                return;
            }

            await getFeedback(payload);
            res.status(200).json({ message: 'The update is up and running!', mode: 'sync' });
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
            res.status(200).json({
                id: job.id,
                kind: job.kind,
                status: job.status,
                createdAt: job.createdAt,
                startedAt: job.startedAt,
                finishedAt: job.finishedAt,
                error: job.error,
                countersUpdated: job.countersUpdated === true,
            });
        } catch (error) {
            handleErrors(res, error, 'Job status error.');
        }
    }
}
