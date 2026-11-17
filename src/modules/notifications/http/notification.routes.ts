import express from 'express';
import { registerRoute } from '@middlewares';
import { NotificationController } from './NotificationController.js';

export function registerNotificationRoutes(app: express.Application): void {
    registerRoute(app, 'get', '/notifications', NotificationController, 'list');
    registerRoute(app, 'get', '/notifications/unread-count', NotificationController, 'unreadCount');
    registerRoute(app, 'post', '/notifications/:id/read', NotificationController, 'markRead');
}
