import express from 'express';
import { registerRoute } from '@middlewares';
import { FeedbackController } from './FeedbackController.js';

export function registerFeedbackRoutes(app: express.Application): void {
    /**
     * @swagger
     * /feedback:
     *   get:
     *     summary: Получить список отзывов
     *     tags: [Отзывы]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список отзывов (может быть пустым массивом)
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/feedback', FeedbackController, 'getFeedback');

    /**
     * @swagger
     * /feedback/{feedbackId}:
     *   delete:
     *     summary: Удалить отзыв
     *     tags: [Отзывы]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: feedbackId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Отзыв успешно удален
     *       404:
     *         description: Отзыв не найден
     */
    registerRoute(app, 'delete', '/feedback/:feedbackId', FeedbackController, 'deleteFeedback');

    /**
     * @swagger
     * /default/feedback:
     *   delete:
     *     summary: Удалить все отзывы
     *     tags: [Отзывы]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Все отзывы успешно удалены
     */
    registerRoute(app, 'delete', '/default/feedback', FeedbackController, 'deleteFeedbackTable');
}
