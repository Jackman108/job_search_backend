import express from 'express';
import { registerRoute } from '@middlewares';
import { WebpayController } from './WebpayController.js';

export function registerWebpayRoutes(app: express.Application): void {
    registerRoute(app, 'get', '/payment/webpay', WebpayController, 'listWebpayPayments');
    registerRoute(app, 'get', '/payment/webpay/:id', WebpayController, 'getWebpayPayment');
    registerRoute(app, 'post', '/payment/webpay', WebpayController, 'createWebpayPayment');
    registerRoute(app, 'put', '/payment/webpay/:id', WebpayController, 'updateWebpayPayment');
    registerRoute(app, 'delete', '/payment/webpay/:id', WebpayController, 'deleteWebpayPayment');
}
