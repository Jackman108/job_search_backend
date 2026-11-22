import express from 'express';
import { register as registerPayments } from '../modules/payments/index.js';

/** @deprecated Prefer `modules/payments.register`. */
export const initializePaymentRoutes = (app: express.Application) => {
    registerPayments(app);
};
