/**
 * Контроллер для интеграции платежных сервисов
 * Переключает стратегии платежей и обрабатывает общие операции
 */
import {
    checkPaymentStatus,
    getPaymentDetails,
    initializeCryptoPayment,
    initializeWebpayPayment,
    processPaymentWebhook,
    refundPayment,
    validatePaymentMethod,
    validatePaymentParams
} from '@integrations';
import { AuthenticatedRequest, RefundPaymentParams } from '@interface';
import { handleControllerError, handleErrors, handleSuccess } from '@middlewares';
import { logger } from '@utils';
import { Request, Response } from 'express';


export class PaymentIntegrationController {

    /**
     * Инициализирует платеж с использованием выбранного метода оплаты
 * @param req Запрос Express
 * @param res Ответ Express
     */
    async initializePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { paymentMethod } = req.params;
            const paymentData = req.body;

            logger.info('Initializing payment with integration controller', { paymentMethod, paymentData });

            // Проверяем, что платежный метод доступен
            if (!validatePaymentMethod(res, paymentMethod)) return;

            // Проверяем обязательные параметры платежа
            const validationResult = validatePaymentParams(paymentData, ['amount']);
            if (!validationResult.success) {
                handleErrors(res, new Error(validationResult.error), 'Initializing payment with validation error');
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
                        currency: paymentData.currency || 'BTC',
                        network: paymentData.network || 'BTC'
                    })
                    : {
                        success: false,
                        error: `Unsupported payment method: ${paymentMethod}`
                    });

            if (result.success && 'data' in result) {
                handleSuccess(res, 'Payment initialized successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Payment initialization failed');
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
    async handlePaymentWebhook(req: Request, res: Response): Promise<void> {
        try {
            const { paymentMethod } = req.params;
            const webhookData = req.body;
            const signature = req.headers['x-webhook-signature'] as string || '';

            logger.info('Processing payment webhook', { paymentMethod, webhookData });

            // Проверяем, что платежный метод доступен
            if (!validatePaymentMethod(res, paymentMethod)) return;

            if (!webhookData) {
                handleErrors(res, new Error('Empty webhook data'), 'Empty webhook data');
                return;
            }

            const result = await processPaymentWebhook(paymentMethod, webhookData, signature);

            if (result.success) {
                handleSuccess(res, 'Webhook processed successfully');
            } else {
                handleErrors(res, new Error(result.error), 'Webhook processing failed');
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
    async checkPaymentStatusController(req: Request, res: Response): Promise<void> {
        try {
            const { paymentMethod, paymentId } = req.params;

            // Проверяем, что платежный метод доступен
            if (!validatePaymentMethod(res, paymentMethod)) return;

            if (!paymentId) {
                handleErrors(res, new Error('Payment ID is required'), 'Payment ID is required');
                return;
            }

            logger.info('Checking payment status', { paymentMethod, paymentId });

            const result = await checkPaymentStatus(paymentMethod, paymentId);

            if (result.success) {
                handleSuccess(res, 'Payment status retrieved successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Status check failed');
            }
        } catch (error) {
            handleControllerError(res, error, 'Error checking payment status');
        }
    };

    /**
     * Обрабатывает запрос на возврат средств (рефанд)
     * @param req Запрос Express
     * @param res Ответ Express
     */
    async handlePaymentRefund(req: Request, res: Response): Promise<void> {
        try {
            const { paymentMethod } = req.params;
            const refundData = req.body as RefundPaymentParams;

            logger.info('Processing payment refund', { paymentMethod, refundData });

            // Проверяем, что платежный метод доступен
            if (!validatePaymentMethod(res, paymentMethod)) return;

            // Проверяем обязательные параметры рефанда
            const validationResult = validatePaymentParams(refundData, ['paymentId']);
            if (!validationResult.success) {
                handleErrors(res, new Error(validationResult.error), 'Validation error');
                return;
            }

            const result = await refundPayment(paymentMethod, refundData);

            if (result.success) {
                handleSuccess(res, 'Payment refunded successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Refund processing failed');
            }
        } catch (error) {
            handleControllerError(res, error, 'Error processing payment refund');
        }
    };

    /**
     * Получает детальную информацию о платеже
     * @param req Запрос Express
     * @param res Ответ Express
     */
    async getPaymentDetailsController(req: Request, res: Response): Promise<void> {
        try {
            const { paymentMethod, paymentId } = req.params;

            // Проверяем, что платежный метод доступен
            if (!validatePaymentMethod(res, paymentMethod)) return;

            if (!paymentId) {
                handleErrors(res, new Error('Payment ID is required'), 'Payment ID is required');
                return;
            }

            logger.info('Getting payment details', { paymentMethod, paymentId });

            const result = await getPaymentDetails(paymentMethod, paymentId);

            if (result.success) {
                handleSuccess(res, 'Payment details retrieved successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Failed to get payment details');
            }
        } catch (error) {
            handleControllerError(res, error, 'Error getting payment details');
        }
    };
}