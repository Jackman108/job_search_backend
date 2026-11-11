/**
 * OpenAPI components for HH automation routes.
 * Consumed by swagger-jsdoc via `apis` in swagger.config.ts.
 */

/**
 * @swagger
 * tags:
 *   - name: HH
 *     description: |
 *       HeadHunter apply / refresh / stop / job status.
 *       Auth: `Authorization: Bearer <JWT>` → `req.userId`.
 *       Queue mode (default `HH_WORKER_MODE=queue`): POST /start and /refresh return **202** + `jobId`;
 *       poll GET /jobs/{jobId}. Sync mode (`HH_WORKER_MODE=sync`): **200** after Puppeteer finishes in-process.
 *
 * components:
 *   schemas:
 *     StartScriptBody:
 *       type: object
 *       required: [email, password, position, message, vacancyUrl]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: HH account email (from SearchForm)
 *         password:
 *           type: string
 *           format: password
 *           description: HH account password (from SearchForm; not stored in API secrets)
 *         position:
 *           type: string
 *           description: Target role / search position label
 *         message:
 *           type: string
 *           description: Cover letter / apply message
 *         vacancyUrl:
 *           type: string
 *           format: uri
 *           description: HH vacancy URL to apply to
 *
 *     RefreshScriptBody:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *
 *     StopScriptBody:
 *       type: object
 *       properties:
 *         browser:
 *           description: Optional legacy sync-path browser hint
 *
 *     HhJobQueuedResponse:
 *       type: object
 *       required: [message, jobId, mode]
 *       properties:
 *         message:
 *           type: string
 *           example: HH apply job queued (detached worker).
 *         jobId:
 *           type: string
 *           format: uuid
 *         mode:
 *           type: string
 *           enum: [queue]
 *
 *     HhJobSyncResponse:
 *       type: object
 *       required: [message, mode]
 *       properties:
 *         message:
 *           type: string
 *         mode:
 *           type: string
 *           enum: [sync]
 *
 *     StopScriptResponse:
 *       type: object
 *       required: [message, cancelledJobIds, cancelledCount, abortedJobIds, abortedCount]
 *       properties:
 *         message:
 *           type: string
 *           example: Script stopped successfully!
 *         cancelledJobIds:
 *           type: array
 *           items:
 *             type: string
 *         cancelledCount:
 *           type: integer
 *         abortedJobIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Jobs that were running and had their worker PID tree-killed
 *         abortedCount:
 *           type: integer
 *
 *     HhJobStatusResponse:
 *       type: object
 *       required: [id, kind, status, createdAt, countersUpdated]
 *       properties:
 *         id:
 *           type: string
 *         kind:
 *           type: string
 *           enum: [sendFeedback, getFeedback]
 *         status:
 *           type: string
 *           enum: [queued, running, done, error, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         startedAt:
 *           type: string
 *           format: date-time
 *         finishedAt:
 *           type: string
 *           format: date-time
 *         error:
 *           type: string
 *         countersUpdated:
 *           type: boolean
 *           description: True after spin/success counters written (sendFeedback only)
 *
 *     ErrorMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *
 *     HealthPayload:
 *       type: object
 *       required: [status, service, ts]
 *       properties:
 *         status:
 *           type: string
 *           enum: [ok]
 *         service:
 *           type: string
 *           example: backend
 *         ts:
 *           type: string
 *           format: date-time
 */
export {};
