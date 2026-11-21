import express from 'express';
import { register as registerSubscriptions } from '../modules/subscriptions/index.js';

/** @deprecated Prefer `modules/subscriptions.register`. */
export const initializeSubscriptionRoutes = (app: express.Application) => {
    registerSubscriptions(app);
};
