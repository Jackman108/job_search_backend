import express from 'express';
import { registerRoute } from '@middlewares';
import { PaymentIntegrationController } from './PaymentIntegrationController.js';

export function registerIntegrationRoutes(app: express.Application): void {
    registerRoute(app, 'post', '/integration/:paymentMethod', PaymentIntegrationController, 'initializePayment');
    // Provider callbacks — public; signature verified before side effects (S6).
    registerRoute(app, 'post', '/webhook/:paymentMethod', PaymentIntegrationController, 'handlePaymentWebhook', false);
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
}
