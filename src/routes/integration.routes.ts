/**
 * Маршруты для интеграции платежных систем
 */
import { PaymentIntegrationController } from '@controllers';
import { registerRoute } from '@middlewares';
import express from 'express';

export const initializeIntegrationRoutes = (app: express.Application) => {
    registerRoute(app, 'post', '/integration/:paymentMethod', PaymentIntegrationController, 'initializePayment');
    registerRoute(app, 'post', '/webhook/:paymentMethod', PaymentIntegrationController, 'handlePaymentWebhook');
    registerRoute(
        app,
        'get',
        '/status/:paymentMethod/:paymentId',
        PaymentIntegrationController,
        'checkPaymentStatusController',
    );
    registerRoute(app, 'post', '/refund/:paymentMethod', PaymentIntegrationController, 'handlePaymentRefund');
    registerRoute(
        app,
        'get',
        '/details/:paymentMethod/:paymentId',
        PaymentIntegrationController,
        'getPaymentDetailsController',
    );
};
