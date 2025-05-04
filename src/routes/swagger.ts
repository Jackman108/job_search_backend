import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from '../config/swagger.config';
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const swaggerRouter = Router();

// @ts-ignore - swagger-ui-express types are incorrect
swaggerRouter.use('/', swaggerUi.serve);
// @ts-ignore - swagger-ui-express types are incorrect
swaggerRouter.get('/', swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Job Search API Documentation'
})); 