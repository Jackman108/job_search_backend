import type express from 'express';

/**
 * @deprecated Integration routes mount via `modules/payments.register` (called from payment.routes).
 */
export const initializeIntegrationRoutes = (_app: express.Application) => {
    // no-op
};
