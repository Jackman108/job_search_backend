/**
 * Контроллер для интеграции платежных сервисов
 * Переключает стратегии платежей и обрабатывает общие операции
 */
import { isPaymentMethodAvailable } from '@config';
import { AuthenticatedRequest, PaymentMethod } from '@interface';
import { checkPaymentStatus, initializeCryptoPayment, initializeWebpayPayment, processPaymentWebhook } from '@services';
import { logger } from '@utils';
import { Request, Response } from 'express';

/**
 * Общая функция для обработки ошибок в контроллере
 * @param res Объект Response Express
 * @param error Ошибка для обработки
 * @param message Сообщение для пользователя
 */
const handleControllerError = (res: Response, error: unknown, message: string): void => {
    logger.error(`Payment integration controller error: ${message}`, { error });
    res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : message
    });
};

/**
 * Проверяет наличие обязательных полей в запросе
 * @param data Данные запроса
 * @param requiredFields Массив обязательных полей
 * @returns Массив отсутствующих полей или null если все поля присутствуют
 */
const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]): string[] | null => {
    const missingFields = requiredFields.filter(field => !data[field]);
    return missingFields.length > 0 ? missingFields : null;
};

/**
 * Инициализирует платеж с использованием выбранного метода оплаты
 * @param req Запрос Express
 * @param res Ответ Express
 */
export const initializePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { paymentMethod } = req.params;
        const paymentData = req.body;

        logger.info('Initializing payment with integration controller', { paymentMethod, paymentData });

        // Проверяем, что платежный метод доступен
        if (!isPaymentMethodAvailable(paymentMethod)) {
            res.status(400).json({
                success: false,
                error: `Payment method '${paymentMethod}' is not available`
            });
            return;
        }

        // Проверяем обязательные поля
        const missingFields = validateRequiredFields(paymentData, ['payment_id', 'amount', 'currency']);
        if (missingFields) {
            handleControllerError(res, new Error(`Missing required fields: ${missingFields.join(', ')}`), 'Failed to retrieve payments');
            return;
        }

        // Выполняем платеж в зависимости от метода оплаты
        let result;

        switch (paymentMethod.toLowerCase()) {
            case 'webpay':
                result = await initializeWebpayPayment({
                    paymentId: paymentData.payment_id,
                    amount: paymentData.amount,
                    currency: paymentData.currency || 'BYN',
                    paymentMethod: paymentMethod as PaymentMethod,
                    userId: req.userId!
                });
                break;

            case 'crypto':
                result = await initializeCryptoPayment({
                    id: paymentData.id || `crypto-${Date.now()}`,
                    payment_id: paymentData.payment_id,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    network: paymentData.network
                });
                break;

            default:
                res.status(400).json({
                    success: false,
                    error: `Unsupported payment method: ${paymentMethod}`
                });
                return;
        }

        if (result.success && result.data) {
            res.status(200).json(result);
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Payment initialization failed'
            });
        }
    } catch (error) {
        handleControllerError(res, error, 'Error in payment initialization');
    }
};

/**
 * Обрабатывает вебхук от платежной системы
 * @param req Запрос Express
 * @param res Ответ Express
 */
export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const { paymentMethod } = req.params;
        const webhookData = req.body;
        const signature = req.headers['x-webhook-signature'] as string || '';

        logger.info('Processing payment webhook', { paymentMethod, webhookData });

        // Проверяем, что платежный метод доступен
        if (!isPaymentMethodAvailable(paymentMethod)) {
            res.status(400).json({
                success: false,
                error: `Payment method '${paymentMethod}' is not available`
            });
            return;
        }

        if (!webhookData) {
            res.status(400).json({
                success: false,
                error: 'Empty webhook data'
            });
            return;
        }

        const result = await processPaymentWebhook(paymentMethod, webhookData, signature);

        if (result.success) {
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Webhook processing failed'
            });
        }
    } catch (error) {
        handleControllerError(res, error, 'Error processing payment webhook');
    }
};

/**
 * Проверяет статус платежа
 * @param req Запрос Express
 * @param res Ответ Express
 */
export const checkPaymentStatusController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { paymentMethod, paymentId } = req.params;

        // Проверяем, что платежный метод доступен
        if (!isPaymentMethodAvailable(paymentMethod)) {
            res.status(400).json({
                success: false,
                error: `Payment method '${paymentMethod}' is not available`
            });
            return;
        }

        if (!paymentId) {
            res.status(400).json({
                success: false,
                error: 'Payment ID is required'
            });
            return;
        }

        logger.info('Checking payment status', { paymentMethod, paymentId });

        const result = await checkPaymentStatus(paymentMethod, paymentId);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Status check failed'
            });
        }
    } catch (error) {
        handleControllerError(res, error, 'Error checking payment status');
    }
}; 