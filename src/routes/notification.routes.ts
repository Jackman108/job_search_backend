import express from 'express';
import { NotificationController } from '@controllers';
import { registerRoute } from '@middlewares';

export const initializeNotificationRoutes = (app: express.Application) => {
    registerRoute(app, 'get', '/notifications', NotificationController, 'list');
    registerRoute(app, 'get', '/notifications/unread-count', NotificationController, 'unreadCount');
    registerRoute(app, 'post', '/notifications/:id/read', NotificationController, 'markRead');
};
