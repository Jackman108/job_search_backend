import express from 'express';
import { registerRoute } from '@middlewares';
import { CryptoPaymentController } from './CryptoPaymentController.js';

export function registerCryptoRoutes(app: express.Application): void {
    registerRoute(app, 'get', '/payment/crypto', CryptoPaymentController, 'listCryptoPayments');
    registerRoute(app, 'get', '/payment/crypto/:paymentId', CryptoPaymentController, 'getCryptoPayment');
    registerRoute(app, 'post', '/payment/crypto', CryptoPaymentController, 'createCryptoPayment');
    registerRoute(app, 'put', '/payment/crypto/:paymentId', CryptoPaymentController, 'updateCryptoPayment');
    registerRoute(app, 'delete', '/payment/crypto/:paymentId', CryptoPaymentController, 'deleteCryptoPayment');
}
