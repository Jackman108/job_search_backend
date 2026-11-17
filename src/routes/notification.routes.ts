import express from 'express';
import { register as registerNotifications } from '../modules/notifications/index.js';

/** @deprecated Prefer `modules/notifications.register`. */
export const initializeNotificationRoutes = (app: express.Application) => {
    registerNotifications(app);
};
