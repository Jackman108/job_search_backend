// controllers/ScriptController.js
import { Response } from 'express';
import { getFeedback } from '@run';
import { sendFeedback } from '@run';
import { handleErrors } from '@middlewares';
import { incrementSpinCount, updateSuccessfulResponsesCount } from '@services';
import { stop } from '@utils';
import { AuthenticatedRequest } from '@interface';
import { personalData } from 'src/secrets';
import { queueGetFeedback, queueSendFeedback, useQueuedWorker } from '../../worker/enqueue.js';

export class ScriptController {
    async startScript(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password, position, message, vacancyUrl } = req.body;
            const payload = {
                userId: req.userId!,
                email: email || personalData.vacancyEmail,
                password: password || personalData.vacancyPassword,
                position: position || personalData.vacancySearch,
                message: message || personalData.coverLetter,
                vacancyUrl: vacancyUrl || personalData.vacanciesUrl,
            };

            if (useQueuedWorker()) {
                const { jobId } = queueSendFeedback(payload);
                // Counters update when the detached worker finishes successfully — tracked in job store for now.
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
            const payload = {
                userId: req.userId!,
                email: email || personalData.vacancyEmail,
                password: password || personalData.vacancyPassword,
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
}
