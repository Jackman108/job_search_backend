import type express from 'express';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerOptions } from '@config';

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const swaggerRouter = Router();

swaggerRouter.use('/', swaggerUi.serve);
swaggerRouter.get(
    '/',
    swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Job Search API Documentation',
    }),
);

export const SWAGGER_MOUNT = '/api-docs';

/** Prod: docs off unless SWAGGER_ENABLED=1. Dev/test: on by default. */
export function isSwaggerEnabled(): boolean {
    const flag = process.env.SWAGGER_ENABLED?.trim().toLowerCase();
    if (flag === '1' || flag === 'true' || flag === 'yes') {
        return true;
    }
    if (flag === '0' || flag === 'false' || flag === 'no') {
        return false;
    }
    return process.env.NODE_ENV !== 'production';
}

export function registerSwaggerRoutes(app: express.Application): void {
    if (!isSwaggerEnabled()) {
        return;
    }
    app.use(SWAGGER_MOUNT, swaggerRouter);
}
