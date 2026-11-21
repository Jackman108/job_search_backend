import type express from 'express';

/**
 * @deprecated Crypto routes mount via `modules/payments.register` (called from payment.routes).
 * Kept so `initializeRoutes` import stays stable — no double-register.
 */
export const initializeCryptoRoutes = (_app: express.Application) => {
    // no-op
};
