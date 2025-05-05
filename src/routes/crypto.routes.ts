import { CryptoPaymentController } from '../controllers/payment/CryptoPaymentController';
import express from 'express';
import { registerRoute } from '../middlewares';

export const initializeCryptoRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /payment/crypto:
     *   post:
     *     summary: Создать криптоплатеж
     *     tags: [Криптоплатежи]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Криптоплатеж успешно создан
     *       400:
     *         description: Нет активной подписки
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/payment/crypto', CryptoPaymentController, 'createPayment');

    /**
     * @swagger
     * /payment/crypto/{paymentId}/status:
     *   get:
     *     summary: Проверить статус криптоплатежа
     *     tags: [Криптоплатежи]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: paymentId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Статус платежа получен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/payment/crypto/:paymentId/status', CryptoPaymentController, 'checkPaymentStatus');

    /**
     * @swagger
     * /payment/crypto/webhook:
     *   post:
     *     summary: Обработчик вебхуков от платежной системы
     *     tags: [Криптоплатежи]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Вебхук успешно обработан
     */
    registerRoute(app, 'post', '/payment/crypto/webhook', CryptoPaymentController, 'handleWebhook');
}; 