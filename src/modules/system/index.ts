import type express from 'express';
import { validateSystemConfig } from './module.config.js';
import { registerHealthRoutes } from './http/health.routes.js';
import { registerSwaggerRoutes } from './http/swagger.routes.js';

export type { HealthPayload } from './domain/health.js';
export { buildHealthPayload, HEALTH_HTTP_PATH, HEALTH_WS_PATH } from './domain/health.js';
export { systemConfig } from './module.config.js';
export { swaggerRouter, SWAGGER_MOUNT } from './http/swagger.routes.js';

/** Composition entry: health + OpenAPI UI. */
export function register(app: express.Application): void {
    validateSystemConfig();
    registerHealthRoutes(app);
    registerSwaggerRoutes(app);
}
