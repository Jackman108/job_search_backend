import { Response } from 'express';
import { AuthenticatedRequest } from '../../../interface/index.js';
import { handleErrors } from '@middlewares';
import {
    listNotifications,
    markNotificationRead,
    unreadNotificationCount,
} from '../application/notificationService.js';

export class NotificationController {
    async list(req: AuthenticatedRequest, res: Response) {
        try {
            const items = await listNotifications(req.userId!);
            res.status(200).json(items);
        } catch (error) {
            handleErrors(res, error, 'Error listing notifications.');
        }
    }

    async unreadCount(req: AuthenticatedRequest, res: Response) {
        try {
            const count = await unreadNotificationCount(req.userId!);
            res.status(200).json({ count });
        } catch (error) {
            handleErrors(res, error, 'Error counting unread notifications.');
        }
    }

    async markRead(req: AuthenticatedRequest, res: Response) {
        try {
            const id = String(req.params.id || '');
            if (!id) {
                return res.status(400).json({ message: 'Invalid notification id.' });
            }
            await markNotificationRead(req.userId!, id);
            res.status(200).json({ ok: true });
        } catch (error) {
            handleErrors(res, error, 'Error marking notification read.');
        }
    }
}
