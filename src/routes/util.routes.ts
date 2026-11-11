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
    registerRoute(app, 'get', '/jobs/:jobId', ScriptController, 'getJobStatus');
};
