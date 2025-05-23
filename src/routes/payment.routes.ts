import { PaymentController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializePaymentRoutes = (app: express.Application) => {
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

    /**
     * @swagger
     * /payment/init:
     *   post:
     *     summary: Инициализировать таблицы платежей
     *     tags: [Платежи]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Таблицы успешно инициализированы
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/payment/init', PaymentController, 'initializeTables');
};