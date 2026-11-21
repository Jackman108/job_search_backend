import express from 'express';
import { registerRoute } from '@middlewares';
import { SubscriptionController } from './SubscriptionController.js';

export function registerSubscriptionRoutes(app: express.Application): void {
    /**
     * @swagger
     * /subscription:
     *   get:
     *     summary: Получить список подписок
     *     tags: [Подписки]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список подписок успешно получен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/subscription', SubscriptionController, 'listSubscriptions');

    /**
     * @swagger
     * /subscription/{id}:
     *   get:
     *     summary: Получить информацию о подписке
     *     tags: [Подписки]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Информация о подписке успешно получена
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Подписка не найдена
     */
    registerRoute(app, 'get', '/subscription/:id', SubscriptionController, 'getSubscription');

    /**
     * @swagger
     * /subscription:
     *   post:
     *     summary: Создать новую подписку
     *     tags: [Подписки]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               subscription_type:
     *                 type: string
     *               start_date:
     *                 type: string
     *                 format: date-time
     *     responses:
     *       201:
     *         description: Подписка успешно создана
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/subscription', SubscriptionController, 'createSubscription');

    /**
     * @swagger
     * /subscription/{id}:
     *   put:
     *     summary: Обновить информацию о подписке
     *     tags: [Подписки]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               subscription_type:
     *                 type: string
     *     responses:
     *       200:
     *         description: Подписка успешно обновлена
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Подписка не найдена
     */
    registerRoute(app, 'put', '/subscription/:id', SubscriptionController, 'updateSubscription');

    /**
     * @swagger
     * /subscription/{id}:
     *   delete:
     *     summary: Удалить подписку
     *     tags: [Подписки]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Подписка успешно удалена
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Подписка не найдена
     */
    registerRoute(app, 'delete', '/subscription/:id', SubscriptionController, 'deleteSubscription');
}
