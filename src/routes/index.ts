import express from 'express';
import { initializeAuthRoutes } from './auth.routes';
import { initializeJobRoutes } from './job.routes';
import { initializeUserRoutes } from './user.routes';
import { initializeCryptoRoutes } from './crypto.routes';
import { initializePaymentRoutes } from './payment.routes';
import { initializeSubscriptionRoutes } from './subscription.routes';
import { initializeUtilRoutes } from './util.routes';
import { initializeVacancyRoutes } from './sending.routes';
import { swaggerRouter } from './swagger';

export const initializeRoutes = (app: express.Application) => {
    // Swagger documentation
    app.use('/api-docs', swaggerRouter);

    // Initialize all route groups
    initializeAuthRoutes(app);
    initializeCryptoRoutes(app);
    initializeVacancyRoutes(app);
    initializeJobRoutes(app);
    initializeUserRoutes(app);
    initializePaymentRoutes(app);
    initializeSubscriptionRoutes(app);
    initializeUtilRoutes(app);
}; 