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

export function registerSwaggerRoutes(app: express.Application): void {
    app.use(SWAGGER_MOUNT, swaggerRouter);
}
