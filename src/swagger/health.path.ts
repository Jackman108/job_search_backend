/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness probe
 *     description: Unauthenticated HTTP health check (no DB). WS liveness is also available at path `/health`.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is up
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthPayload'
 */
export {};
