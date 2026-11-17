import { ScriptController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializeUtilRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /start:
     *   post:
     *     summary: Queue HH apply (sendFeedback)
     *     description: |
     *       Requires JWT. Body credentials come from the client SearchForm.
     *       Always **202** `{ jobId, mode: queue }` — poll `GET /jobs/{jobId}`.
     *       Puppeteer runs in detached `@market-hunter/hh-worker`.
     *     tags: [HH]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/StartScriptBody'
     *     responses:
     *       202:
     *         description: Apply job accepted into detached worker queue
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HhJobQueuedResponse'
     *       400:
     *         description: Missing body fields, or missing userId (no usable Bearer)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorMessage'
     *       401:
     *         description: Invalid or expired JWT
     */
    registerRoute(app, 'post', '/start', ScriptController, 'startScript');

    /**
     * @swagger
     * /stop:
     *   post:
     *     summary: Stop HH automation for the caller
     *     description: |
     *       Cancels **queued** jobs and aborts **running** workers for `req.userId`
     *       (tree-kill detached PID).
     *     tags: [HH]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/StopScriptBody'
     *     responses:
     *       200:
     *         description: Stop acknowledged; lists cancelled and aborted job ids
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/StopScriptResponse'
     *       400:
     *         description: Missing userId (no usable Bearer)
     *       401:
     *         description: Invalid or expired JWT
     */
    registerRoute(app, 'post', '/stop', ScriptController, 'stopScript');

    /**
     * @swagger
     * /refresh:
     *   post:
     *     summary: Queue HH feedback refresh (getFeedback)
     *     description: |
     *       Requires JWT + HH email/password from SearchForm.
     *       Always **202** + `jobId` (detached worker).
     *     tags: [HH]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RefreshScriptBody'
     *     responses:
     *       202:
     *         description: Refresh job queued
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HhJobQueuedResponse'
     *       400:
     *         description: Missing email/password, or missing userId
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorMessage'
     *       401:
     *         description: Invalid or expired JWT
     */
    registerRoute(app, 'post', '/refresh', ScriptController, 'refreshData');

    /**
     * @swagger
     * /sync-resume:
     *   post:
     *     summary: Queue HH resume sync (first resume → local resume stack)
     *     description: |
     *       Requires JWT. HH email/password optional in body — if omitted, uses the first
     *       saved `vacancy_auth` (same credentials as «Отправка заявок»). Always **202** + `jobId`.
     *       If the HH account has several resumes, the first one is used.
     *     tags: [HH]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email: { type: string }
     *               password: { type: string }
     *     responses:
     *       202:
     *         description: Resume sync job queued
     *       400:
     *         description: No HH credentials in body or vacancy_auth
     *       401:
     *         description: Invalid or expired JWT
     */
    registerRoute(app, 'post', '/sync-resume', ScriptController, 'syncResume');

    /**
     * @swagger
     * /jobs/{jobId}:
     *   get:
     *     summary: HH worker job status
     *     description: |
     *       Authz: job must belong to `req.userId` (**403** otherwise).
     *       Response omits stored HH credentials.
     *     tags: [HH]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: jobId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Job status
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HhJobStatusResponse'
     *       400:
     *         description: Missing userId
     *       401:
     *         description: Invalid or expired JWT
     *       403:
     *         description: Job exists but belongs to another user
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorMessage'
     *       404:
     *         description: Job not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorMessage'
     */
    registerRoute(app, 'get', '/jobs', ScriptController, 'listJobs');
    registerRoute(app, 'get', '/jobs/:jobId', ScriptController, 'getJobStatus');
    registerRoute(app, 'post', '/jobs/:jobId/captcha-refresh', ScriptController, 'requestCaptchaRefresh');

    /**
     * @swagger
     * /jobs/{jobId}/captcha:
     *   post:
     *     summary: Submit CAPTCHA text for a headless HH job
     *     description: |
     *       When `awaitingCaptcha` is true on GET /jobs/{jobId}, post `{ "answer": "…" }`.
     *       The detached worker types it and continues — no headed Chrome required.
     *     tags: [HH]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: jobId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [answer]
     *             properties:
     *               answer:
     *                 type: string
     *     responses:
     *       200:
     *         description: Answer queued for the worker
     *       409:
     *         description: Job not awaiting CAPTCHA
     */
    registerRoute(app, 'post', '/jobs/:jobId/captcha', ScriptController, 'submitCaptchaAnswer');

    /**
     * @swagger
     * /jobs/{jobId}/captcha-image:
     *   get:
     *     summary: CAPTCHA PNG captured by the headless worker
     *     tags: [HH]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: jobId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: image/png
     *       404:
     *         description: Image not ready
     */
    registerRoute(app, 'get', '/jobs/:jobId/captcha-image', ScriptController, 'getCaptchaImage');
};
