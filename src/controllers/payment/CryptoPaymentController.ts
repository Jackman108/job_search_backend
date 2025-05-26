import { AuthenticatedRequest, InitCryptoPaymentParams } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';
import { createMockCryptoPayment, cryptoPaymentOperations, processWebhook } from '@services';
import { Response } from 'express';
import { USE_MOCK_PROVIDER } from '../../config/payment.config';

/**
 * Контроллер для работы с криптоплатежами
 * Использует функциональный подход и обработку ошибок
 */
export class CryptoPaymentController {
    /**
     * Получение списка криптоплатежей пользователя
     */
    async listCryptoPayments(req: AuthenticatedRequest, res: Response) {
        const result = await cryptoPaymentOperations.listCryptoPayments(req.userId!);

        if (result.success) {
            res.status(200).json(result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Error listing crypto payments');
        }
    }

    /**
     * Получение информации о конкретном криптоплатеже
     */
    async getCryptoPayment(req: AuthenticatedRequest, res: Response) {
        const result = await cryptoPaymentOperations.getCryptoPayment(req.userId!, req.params.paymentId);

        if (result.success) {
            handleSuccess(res, 'Crypto payment retrieved successfully', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Failed to fetch crypto payment');
        }
    }

    /**
     * Создание нового криптоплатежа
     */
    async createCryptoPayment(req: AuthenticatedRequest, res: Response) {
        const { id, subscription_id, amount, currency, network } = req.body;

        if (!id || !subscription_id || !amount) {
            return handleErrors(res, new Error('Missing required fields'), 'ID, subscription_id, and amount are required');
        }

        try {
            const params: InitCryptoPaymentParams = {
                id,
                subscription_id,
                amount,
                currency,
                network
            };

            // В режиме разработки используем моковые данные
            if (USE_MOCK_PROVIDER) {
                console.log('Using mock crypto payment in development mode');
                const mockPayment = createMockCryptoPayment(params);
                handleSuccess(res, 'Mock crypto payment created successfully', mockPayment);
                return;
            }

            // В продакшн режиме используем реальные данные
            const result = await cryptoPaymentOperations.createCryptoPayment(params);

            if (result.success) {
                handleSuccess(res, 'Crypto payment created successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Failed to create crypto payment');
            }
        } catch (error) {
            handleErrors(res, error, 'Failed to create crypto payment');
        }
    }

    /**
    * Обновление криптоплатежа
    */
    async updateCryptoPayment(req: AuthenticatedRequest, res: Response) {
        const result = await cryptoPaymentOperations.updateCryptoPayment(
            req.params.paymentId,
            req.body
        );

        if (result.success) {
            handleSuccess(res, 'Crypto payment updated successfully', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Failed to update crypto payment');
        }
    }

    /**
     * Удаление криптоплатежа
     */
    async deleteCryptoPayment(req: AuthenticatedRequest, res: Response) {
        const result = await cryptoPaymentOperations.deleteCryptoPayment(req.userId!, req.params.paymentId);

        if (result.success) {
            handleSuccess(res, 'Crypto payment deleted successfully');
        } else {
            handleErrors(res, new Error(result.error), 'Failed to delete crypto payment');
        }
    }

    /**
     * Проверка статуса криптоплатежа
     */
    async checkCryptoPaymentStatus(req: AuthenticatedRequest, res: Response) {
        const paymentId = req.params.paymentId || (req.body && req.body.paymentId);

        if (!paymentId) {
            return handleErrors(res, new Error('Payment ID is required'), 'Payment ID is required');
        }

        const result = await cryptoPaymentOperations.checkCryptoPaymentStatus(req.userId!, paymentId);

        if (result.success) {
            handleSuccess(res, 'Payment status retrieved', { status: result.data });
        } else {
            handleErrors(res, new Error(result.error), 'Failed to check payment status');
        }
    }

    /**
     * Обработка вебхука от криптопровайдера
     */
    async handleWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
        const signature = req.headers['x-nowpayments-sig'] as string;

        if (!signature) {
            return handleErrors(res, new Error('Missing signature'), 'Signature is required');
        }

        // В режиме разработки используем моковые данные
        if (USE_MOCK_PROVIDER) {
            console.log('Using mock webhook processing in development mode');
            const success = processWebhook(req.body, signature);
            handleSuccess(res, 'Mock webhook processed successfully');
            return;
        }

        const result = await cryptoPaymentOperations.processWebhook(req.body, signature);

        if (result.success) {
            handleSuccess(res, 'Webhook processed successfully');
        } else {
            handleErrors(res, new Error(result.error), 'Failed to process webhook');
        }
    }
} 