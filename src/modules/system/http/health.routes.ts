import type express from 'express';
import { buildHealthPayload, HEALTH_HTTP_PATH } from '../domain/health.js';

/** Unauthenticated liveness probe (no DB). */
export function registerHealthRoutes(app: express.Application): void {
    app.get(HEALTH_HTTP_PATH, (_req, res) => {
        res.status(200).json(buildHealthPayload('backend'));
    });
}
