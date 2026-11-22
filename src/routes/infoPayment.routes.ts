import type express from 'express';

/**
 * @deprecated Info routes mount via `modules/payments.register` (called from payment.routes).
 * Kept so `initializeRoutes` import stays stable — no double-register.
 */
export const initializeInfoPaymentRoutes = (_app: express.Application) => {
    // no-op
};
