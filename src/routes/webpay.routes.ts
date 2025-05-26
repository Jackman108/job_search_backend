import express from 'express';
import { registerRoute } from '../middlewares';
import { WebpayController } from '../controllers/payment/WebpayController';

export const initializeWebpayRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /payment/webpay/init:
     *   post:
     *     summary: Инициализировать WebPay платеж
     *     tags: [WebPay]
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
     *               currency:
     *                 type: string
     *     responses:
     *       200:
     *         description: Платеж успешно инициализирован
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/payment/webpay/init', WebpayController, 'initWebpayPayment');

    /**
     * @swagger
     * /payment/webpay/status/{orderNum}:
     *   get:
     *     summary: Получить статус WebPay платежа
     *     tags: [WebPay]
     *     parameters:
     *       - in: path
     *         name: orderNum
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Статус платежа успешно получен
     */
    registerRoute(app, 'get', '/payment/webpay/status/:orderNum', WebpayController, 'checkWebpayStatus', false);

    /**
     * @swagger
     * /payment/webpay/details/{orderNum}:
     *   get:
     *     summary: Получить детали WebPay платежа
     *     tags: [WebPay]
     *     parameters:
     *       - in: path
     *         name: orderNum
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Детали платежа успешно получены
     */
    registerRoute(app, 'get', '/payment/webpay/details/:orderNum', WebpayController, 'getWebpayPayment', false);

    /**
     * @swagger
     * /payment/webpay/return:
     *   get:
     *     summary: Обработка возврата после успешной оплаты
     *     tags: [WebPay]
     *     parameters:
     *       - in: query
     *         name: wsb_order_num
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: wsb_tid
     *         schema:
     *           type: string
     *     responses:
     *       302:
     *         description: Редирект на страницу успешной оплаты
     */
    registerRoute(app, 'get', '/payment/webpay/return', WebpayController, 'handleReturn', false);

    /**
     * @swagger
     * /payment/webpay/cancel:
     *   get:
     *     summary: Обработка отмены платежа
     *     tags: [WebPay]
     *     parameters:
     *       - in: query
     *         name: wsb_order_num
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       302:
     *         description: Редирект на страницу отмены оплаты
     */
    registerRoute(app, 'get', '/payment/webpay/cancel', WebpayController, 'handleCancel', false);

    /**
     * @swagger
     * /payment/webpay/notify:
     *   post:
     *     summary: Обработка уведомления от WebPay
     *     tags: [WebPay]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Уведомление успешно обработано
     */
    registerRoute(app, 'post', '/payment/webpay/notify', WebpayController, 'handleNotify', false);
}; 