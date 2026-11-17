import type express from 'express';
import { validateNotificationsConfig } from './module.config.js';
import { registerNotificationRoutes } from './http/notification.routes.js';

export type { AppNotification } from './domain/types.js';
export {
    ensureDailyNotification,
    listNotifications,
    markNotificationRead,
    unreadNotificationCount,
} from './application/notificationService.js';
export { NotificationController } from './http/NotificationController.js';
export { notificationsConfig } from './module.config.js';

/** Composition entry: validate config + mount HTTP routes. */
export function register(app: express.Application): void {
    validateNotificationsConfig();
    registerNotificationRoutes(app);
}
