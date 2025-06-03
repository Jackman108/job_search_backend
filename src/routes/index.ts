import express from 'express';
import { initializeAuthRoutes } from './auth.routes';
import { initializeCryptoRoutes } from './crypto.routes';
import { initializeInfoPaymentRoutes } from './infoPayment.routes';
import { initializeIntegrationRoutes } from './integration.routes';
import { initializeJobRoutes } from './job.routes';
import { initializePaymentRoutes } from './payment.routes';
import { initializeVacancyRoutes } from './sending.routes';
import { initializeSubscriptionRoutes } from './subscription.routes';
import { swaggerRouter } from './swagger';
import { initializeUserRoutes } from './user.routes';
import { initializeUtilRoutes } from './util.routes';
import { initializeWebpayRoutes } from './webpay.routes';

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
    initializeInfoPaymentRoutes(app);
    initializeWebpayRoutes(app);

    // Инициализация интеграционных маршрутов
    initializeIntegrationRoutes(app);
}; 