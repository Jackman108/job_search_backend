import { PaymentController, SubscriptionController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializePaymentRoutes = (app: express.Application) => {
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
     *               name:
     *                 type: string
     *               price:
     *                 type: number
     *               duration:
     *                 type: number
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
     *               name:
     *                 type: string
     *               price:
     *                 type: number
     *               duration:
     *                 type: number
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

    /**
     * @swagger
     * /payment:
     *   get:
     *     summary: Получить список платежей
     *     tags: [Платежи]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список платежей успешно получен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/payment', PaymentController, 'listPayments');

    /**
     * @swagger
     * /payment/{id}:
     *   get:
     *     summary: Получить информацию о платеже
     *     tags: [Платежи]
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
     *         description: Информация о платеже успешно получена
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Платеж не найден
     */
    registerRoute(app, 'get', '/payment/:id', PaymentController, 'getPayment');

    /**
     * @swagger
     * /payment:
     *   post:
     *     summary: Создать новый платеж
     *     tags: [Платежи]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               amount:
     *                 type: number
     *               subscriptionId:
     *                 type: string
     *               userId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Платеж успешно создан
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/payment', PaymentController, 'createPayment');

    /**
     * @swagger
     * /payment/{id}:
     *   put:
     *     summary: Обновить информацию о платеже
     *     tags: [Платежи]
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
     *               amount:
     *                 type: number
     *               status:
     *                 type: string
     *     responses:
     *       200:
     *         description: Платеж успешно обновлен
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Платеж не найден
     */
    registerRoute(app, 'put', '/payment/:id', PaymentController, 'updatePayment');

    /**
     * @swagger
     * /payment/{id}:
     *   delete:
     *     summary: Удалить платеж
     *     tags: [Платежи]
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
     *         description: Платеж успешно удален
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Платеж не найден
     */
    registerRoute(app, 'delete', '/payment/:id', PaymentController, 'deletePayment');

    /**
     * @swagger
     * /payment/{id}:
     *   patch:
     *     summary: Обновить статус платежа
     *     tags: [Платежи]
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
     *               status:
     *                 type: string
     *                 enum: [pending, completed, failed]
     *     responses:
     *       200:
     *         description: Статус платежа успешно обновлен
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Платеж не найден
     */
    registerRoute(app, 'patch', '/payment/:id', PaymentController, 'updatePaymentStatus');
}; 