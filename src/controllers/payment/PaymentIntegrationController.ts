/**
 * Контроллер для интеграции платежных сервисов
 * Переключает стратегии платежей и обрабатывает общие операции
 */
import { isPaymentMethodAvailable } from '@config';
import { checkPaymentStatus, initializeCryptoPayment, initializeWebpayPayment, processPaymentWebhook } from '@integrations';
import { validatePaymentParams } from '@integrations';
import { AuthenticatedRequest, PaymentMethod } from '@interface';
import { handleControllerError } from '@middlewares';
import { logger } from '@utils';
import { Request, Response } from 'express';

/**
 * Проверяет доступность метода оплаты и возвращает соответствующий ответ в случае ошибки
 * @param res Ответ Express
 * @param paymentMethod Метод оплаты
 * @returns true если метод доступен, false если нет (и отправляет ответ)
 */
const validatePaymentMethod = (res: Response, paymentMethod: string): boolean => {
    if (!isPaymentMethodAvailable(paymentMethod)) {
        res.status(400).json({
            success: false,
            error: `Payment method '${paymentMethod}' is not available`
        });
        return false;
    }
    return true;
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
        if (!validatePaymentMethod(res, paymentMethod)) return;

        // Проверяем обязательные параметры платежа
        const validationResult = validatePaymentParams(paymentData, ['amount']);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                error: validationResult.error
            });
            return;
        }

        // Базовые параметры платежа
        const baseParams = {
            paymentId: paymentData.payment_id,
            amount: paymentData.amount,
            userId: req.userId!
        };

        // Выполняем платеж в зависимости от метода оплаты
        const result = await (paymentMethod.toLowerCase() === 'webpay'
            ? initializeWebpayPayment({
                ...baseParams,
                currency: paymentData.currency || 'BYN'
            })
            : paymentMethod.toLowerCase() === 'crypto'
                ? initializeCryptoPayment({
                    ...baseParams,
                    currency: paymentData.currency,
                    network: paymentData.network
                })
                : {
                    success: false,
                    error: `Unsupported payment method: ${paymentMethod}`
                });

        if (result.success && 'data' in result) {
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
        if (!validatePaymentMethod(res, paymentMethod)) return;

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
        if (!validatePaymentMethod(res, paymentMethod)) return;

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