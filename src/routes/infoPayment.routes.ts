import express from 'express';
import { registerRoute } from '../middlewares';
import { InfoPaymentController } from '../controllers/payment/InfoPaymentController';

export const initializeInfoPaymentRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /payment/info/methods:
     *   get:
     *     summary: Получить информацию о доступных методах оплаты
     *     tags: [Информация о платежах]
     *     responses:
     *       200:
     *         description: Информация о методах оплаты успешно получена
     */
    registerRoute(app, 'get', '/payment/info/methods', InfoPaymentController, 'getPaymentMethods', false);

    /**
     * @swagger
     * /payment/info/current-plan:
     *   get:
     *     summary: Получить информацию о текущем тарифе пользователя
     *     tags: [Информация о платежах]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Информация о текущем тарифе успешно получена
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/payment/info/current-plan', InfoPaymentController, 'getCurrentPlan');

    /**
     * @swagger
     * /payment/info/test-page:
     *   get:
     *     summary: Получить тестовую страницу для проверки платежей
     *     tags: [Информация о платежах]
     *     responses:
     *       200:
     *         description: Тестовая страница успешно получена
     */
    registerRoute(app, 'get', '/payment/info/test-page', InfoPaymentController, 'getTestPaymentPage', false);
}; 