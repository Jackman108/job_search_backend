/**
 * Маршруты для интеграции платежных систем
 * Используется для общего интерфейса взаимодействия с разными платежными системами
 */
import express from 'express';
import { extractUserId, validateUserIdMiddleware } from '../middlewares/auth.middleware.js';
import { handlePaymentWebhook, initializePayment, checkPaymentStatusController } from '../controllers/payment/PaymentIntegrationController.js';

const router = express.Router();

/**
 * @swagger
 * /api/payments/integration/{paymentMethod}:
 *   post:
 *     summary: Инициализация платежа с использованием выбранной платежной системы
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethod
 *         required: true
 *         schema:
 *           type: string
 *           enum: [webpay, crypto]
 *         description: Метод оплаты (webpay, crypto и др.)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription_id
 *               - amount
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID платежа (если есть)
 *               subscription_id:
 *                 type: string
 *                 description: ID подписки
 *               amount:
 *                 type: number
 *                 description: Сумма платежа
 *               currency:
 *                 type: string
 *                 description: Валюта платежа
 *               network:
 *                 type: string
 *                 description: Сеть для криптоплатежа
 *               success_url:
 *                 type: string
 *                 description: URL для редиректа при успешной оплате
 *               cancel_url:
 *                 type: string
 *                 description: URL для редиректа при отмене платежа
 *     responses:
 *       200:
 *         description: Платеж успешно инициализирован
 *       400:
 *         description: Ошибка при инициализации платежа
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post('/integration/:paymentMethod', extractUserId, validateUserIdMiddleware, initializePayment);

/**
 * @swagger
 * /api/payments/webhook/{paymentMethod}:
 *   post:
 *     summary: Обработка вебхука от платежной системы
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentMethod
 *         required: true
 *         schema:
 *           type: string
 *           enum: [webpay, crypto]
 *         description: Метод оплаты (webpay, crypto и др.)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Вебхук успешно обработан
 *       400:
 *         description: Ошибка при обработке вебхука
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post('/webhook/:paymentMethod', handlePaymentWebhook);

/**
 * @swagger
 * /api/payments/status/{paymentMethod}/{paymentId}:
 *   get:
 *     summary: Проверка статуса платежа
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethod
 *         required: true
 *         schema:
 *           type: string
 *           enum: [webpay, crypto]
 *         description: Метод оплаты (webpay, crypto и др.)
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID платежа
 *     responses:
 *       200:
 *         description: Статус платежа успешно получен
 *       400:
 *         description: Ошибка при получении статуса платежа
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get('/status/:paymentMethod/:paymentId', extractUserId, validateUserIdMiddleware, checkPaymentStatusController);

/**
 * Инициализация маршрутов для интеграции платежей
 * @param app Экземпляр Express приложения
 */
export const initializePaymentIntegrationRoutes = (app: express.Application) => {
    app.use('/api/payments', router);
};

export default router; 