import type express from 'express';
import { validatePaymentsConfig } from './module.config.js';
import { registerCryptoRoutes } from './http/crypto.routes.js';
import { registerInfoPaymentRoutes } from './http/infoPayment.routes.js';
import { registerPaymentRoutes } from './http/payment.routes.js';
import { registerWebpayRoutes } from './http/webpay.routes.js';
import { registerIntegrationRoutes } from './http/integration.routes.js';

export { PaymentController } from './http/PaymentController.js';
export { InfoPaymentController } from './http/InfoPaymentController.js';
export { CryptoPaymentController } from './http/CryptoPaymentController.js';
export { WebpayController } from './http/WebpayController.js';
export { PaymentIntegrationController } from './http/PaymentIntegrationController.js';

export {
    createPayment,
    createTablePayments,
    deletePayment,
    getPayment,
    listPayments,
    safePaymentOperations,
    updatePayment,
} from './application/paymentService.js';
export { infoPaymentOperations } from './application/infoPaymentService.js';
export {
    createCryptoPayment,
    createTableCryptoPayments,
    cryptoService,
    deleteCryptoPayment,
    getActiveCryptoPayment,
    getCryptoPayment,
    getExistingCryptoPayment,
    listCryptoPayments,
    updateCryptoPayment,
} from './application/cryptoService.js';
export {
    createTableWebpayPayments,
    createWebpayPayment,
    deleteWebpayPayment,
    getActiveWebpayPayment,
    getWebpayPayment,
    getWebpayPaymentByOrderNum,
    getWebpayPaymentByPaymentId,
    listWebpayPayments,
    updateWebpayPayment,
    updateWebpayPaymentByOrderNum,
    webpayService,
} from './application/webpayService.js';
export { paymentsConfig } from './module.config.js';
export { claimWebhookEvent } from './application/webhookEvents.js';
export { activateAfterPaid, maybeActivateAfterStatus } from './application/activateAfterPaid.js';
export {
    buildProviderEventId,
    decideWebhookGate,
    resolveCryptoEventKey,
    resolveWebpayEventKey,
    signaturesMatch,
    type WebhookClaim,
    type WebhookGateDecision,
} from './domain/webhookGate.js';

export function register(app: express.Application): void {
    validatePaymentsConfig();
    // Static paths BEFORE /payment/:id — otherwise Express treats "crypto"/"webpay" as ids
    // and GET /payment/crypto → Payment not found for id crypto (500 spam on every layout poll).
    registerCryptoRoutes(app);
    registerWebpayRoutes(app);
    registerPaymentRoutes(app);
    registerInfoPaymentRoutes(app);
    registerIntegrationRoutes(app);
}
