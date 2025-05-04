import express from 'express';
import { initializeAuthRoutes } from './auth.routes';
import { initializeVacancyRoutes } from './sending.routes';
import { initializeUserRoutes } from './user.routes';
import { initializePaymentRoutes } from './payment.routes';
import { initializeUtilRoutes } from './util.routes';
import { initializeJobRoutes } from './job.routes';
import { swaggerRouter } from './swagger';

export const initializeRoutes = (app: express.Application) => {
    // Swagger documentation
    app.use('/api-docs', swaggerRouter);

    // Initialize all route groups
    initializeAuthRoutes(app);
    initializeVacancyRoutes(app);
    initializeJobRoutes(app);
    initializeUserRoutes(app);
    initializePaymentRoutes(app);
    initializeUtilRoutes(app);
}; 