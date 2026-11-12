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
 *       Queue mode only: POST /start and /refresh return **202** + `jobId`;
 *       poll GET /jobs/{jobId}. Puppeteer runs in the detached `@market-hunter/hh-worker` process.
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
 *           description: Optional legacy browser hint (ignored)
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
 *         lastEvent:
 *           type: string
 *           description: Latest worker progress line (CAPTCHA / errors) for poll SoT
 *         lastEventAt:
 *           type: string
 *           format: date-time
 *         captchaSrc:
 *           type: string
 *           description: CAPTCHA image URL when detected (login or mid-apply)
 *         summary:
 *           type: object
 *           description: Apply-run totals for completion modal (sendFeedback)
 *           properties:
 *             found:
 *               type: integer
 *               description: SERP total after search/filters (announced at start)
 *             success:
 *               type: integer
 *             skipped:
 *               type: integer
 *             failed:
 *               type: integer
 *             pages:
 *               type: integer
 *             endReason:
 *               type: string
 *               enum: [last_page, page_cap, stopped, aborted]
 *               description: Why the apply loop ended (done-modal copy)
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
