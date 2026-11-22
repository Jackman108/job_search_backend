import fs from 'fs';
import { Response } from 'express';
import { handleErrors } from '@middlewares';
import type {
    AuthenticatedRequest,
    CaptchaAnswerBody,
    HhJobQueuedResponse,
    RefreshScriptBody,
    StartScriptBody,
    StopScriptResponse,
    SyncResumeBody,
} from '../../../interface/index.js';
import { stop } from '../../../utils/stopManager.js';
import { upsertVacancyAuthCredentials } from '../../search-profile/index.js';
import { resolveHhApplyCredentials } from '../application/resolveHhApplyCredentials.js';
import {
    enqueueApply,
    enqueueFeedbackRefresh,
    enqueueResumeSync,
    getPublicJobStatus,
    listUserJobs,
    requestCaptchaRefresh,
    resolveCaptchaImagePath,
    stopUserJobs,
    submitCaptchaAnswer,
} from '../application/hhJobService.js';

export class HhJobController {
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
            await upsertVacancyAuthCredentials(req.userId!, email, password);
            const { jobId } = enqueueApply({
                userId: req.userId!,
                email,
                password: '',
                position,
                message,
                vacancyUrl,
                dryRun: dryRun === true,
                applyCap: typeof applyCap === 'number' && applyCap > 0 ? Math.floor(applyCap) : undefined,
            });
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
            const { cancelledJobIds, abortedJobIds } = stopUserJobs(req.userId!);
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
            await upsertVacancyAuthCredentials(req.userId!, email, password);
            const { jobId } = enqueueFeedbackRefresh({
                userId: req.userId!,
                email,
                password: '',
            });
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

    async syncResume(req: AuthenticatedRequest, res: Response) {
        try {
            const bodyIn = (req.body || {}) as Partial<SyncResumeBody>;
            const creds = await resolveHhApplyCredentials(req.userId!, bodyIn.email, bodyIn.password);
            if (!creds) {
                res.status(400).json({
                    code: 'HH_CREDS_MISSING',
                    message:
                        'Нет сохранённых логина/пароля HH. Откройте «Отправка заявок», введите email и пароль, нажмите Сохранить — затем синхронизируйте резюме.',
                });
                return;
            }
            await upsertVacancyAuthCredentials(req.userId!, creds.email, creds.password);
            const { jobId } = enqueueResumeSync({
                userId: req.userId!,
                email: creds.email,
                password: '',
            });
            const body: HhJobQueuedResponse = {
                message: 'HH resume sync queued (detached worker).',
                jobId,
                mode: 'queue',
            };
            res.status(202).json(body);
        } catch (error) {
            handleErrors(res, error, 'Resume sync queue error.');
        }
    }

    async listJobs(req: AuthenticatedRequest, res: Response) {
        try {
            const limitRaw = Number(req.query.limit);
            const jobs = listUserJobs(req.userId!, Number.isFinite(limitRaw) ? limitRaw : undefined);
            res.status(200).json(jobs);
        } catch (error) {
            handleErrors(res, error, 'Job list error.');
        }
    }

    async requestCaptchaRefresh(req: AuthenticatedRequest, res: Response) {
        try {
            const result = requestCaptchaRefresh(req.params.jobId, req.userId!);
            if (!result.ok) {
                res.status(result.status).json({ message: result.message });
                return;
            }
            res.status(200).json({ message: 'CAPTCHA refresh requested.', jobId: result.jobId });
        } catch (error) {
            handleErrors(res, error, 'CAPTCHA refresh error.');
        }
    }

    async getJobStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const result = getPublicJobStatus(req.params.jobId, req.userId!);
            if (!result.ok) {
                res.status(result.status).json({ message: result.message });
                return;
            }
            res.status(200).json(result.body);
        } catch (error) {
            handleErrors(res, error, 'Job status error.');
        }
    }

    async getCaptchaImage(req: AuthenticatedRequest, res: Response) {
        try {
            const result = resolveCaptchaImagePath(req.params.jobId, req.userId!);
            if (!result.ok) {
                res.status(result.status).json({ message: result.message });
                return;
            }
            res.setHeader('Cache-Control', 'no-store');
            res.type('png');
            fs.createReadStream(result.filePath).pipe(res);
        } catch (error) {
            handleErrors(res, error, 'CAPTCHA image error.');
        }
    }

    async submitCaptchaAnswer(req: AuthenticatedRequest, res: Response) {
        try {
            const { answer } = req.body as Partial<CaptchaAnswerBody>;
            const trimmed = typeof answer === 'string' ? answer.trim() : '';
            if (!trimmed) {
                res.status(400).json({ message: 'Required: answer (captcha text).' });
                return;
            }
            const result = submitCaptchaAnswer(req.params.jobId, req.userId!, trimmed);
            if (!result.ok) {
                res.status(result.status).json({ message: result.message });
                return;
            }
            res.status(200).json({ message: 'CAPTCHA answer accepted.', jobId: result.jobId });
        } catch (error) {
            handleErrors(res, error, 'CAPTCHA answer error.');
        }
    }
}
