import express from 'express';
import { registerRoute } from '@middlewares';
import { CryptoPaymentController } from '@controllers';

export const initializeCryptoRoutes = (app: express.Application) => {
    /**
    * @swagger
    * /payment/crypto:
    *   get:
    *     summary: Получить список криптоплатежей
    *     tags: [Криптоплатежи]
    *     security:
    *       - bearerAuth: []
    *     responses:
    *       200:
    *         description: Список криптоплатежей успешно получен
    *         content:
    *           application/json:
    *             schema:
    *               type: array
    *               items:
    *                 $ref: '#/components/schemas/CryptoPaymentDetails'
    *       401:
    *         description: Не авторизован
    */
    registerRoute(app, 'get', '/payment/crypto', CryptoPaymentController, 'listCryptoPayments');

    /**
    * @swagger
    * /payment/crypto/{paymentId}:
    *   get:
    *     summary: Получить информацию о криптоплатеже
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
    *         description: Информация о криптоплатеже успешно получена
    *       401:
    *         description: Не авторизован
    *       404:
    *         description: Криптоплатеж не найден
    */
    registerRoute(app, 'get', '/payment/crypto/:paymentId', CryptoPaymentController, 'getCryptoPayment');

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
    registerRoute(app, 'post', '/payment/crypto', CryptoPaymentController, 'createCryptoPayment');



    /**
     * @swagger
     * /payment/crypto/{paymentId}:
     *   put:
     *     summary: Обновить опции криптоплатежа
     *     tags: [Криптоплатежи]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: paymentId
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Опции криптоплатежа успешно обновлены
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'put', '/payment/crypto/:paymentId', CryptoPaymentController, 'updateCryptoPayment');



    /**
     * @swagger
     * /payment/crypto/{paymentId}:
     *   delete:
     *     summary: Удалить криптоплатеж
     *     tags: [Криптоплатежи]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: paymentId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Криптоплатеж успешно удален
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Платеж не найден
     */
    registerRoute(app, 'delete', '/payment/crypto/:paymentId', CryptoPaymentController, 'deleteCryptoPayment');


};



