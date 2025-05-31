import { AuthenticatedRequest } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';
import { cryptoService } from '@services';
import { Response } from 'express';
import { USE_MOCK_PROVIDER } from '@config';
import { logger } from '@utils';

/**
 * Контроллер для работы с криптоплатежами
 * Использует функциональный подход и обработку ошибок
 */
export class CryptoPaymentController {
    /**
     * Получение списка криптоплатежей пользователя
     */
    async listCryptoPayments(req: AuthenticatedRequest, res: Response) {
        const result = await cryptoService.listPayments();

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
        const result = await cryptoService.getPayment(req.userId!, req.params.paymentId);

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
        const { subscription_id, amount, currency = 'BTC', payment_method = 'crypto', id } = req.body;

        if (!subscription_id) {
            return handleErrors(res, new Error('Missing required fields'), 'Subscription ID and amount are required');
        }

        const result = await cryptoService.createPayment({
            subscription_id,
            amount,
            currency,
            payment_method,
            id
        });

        if (result.success) {
            handleSuccess(res, 'Crypto payment created successfully', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Failed to create crypto payment');
        }

    }

    /**
    * Обновление криптоплатежа
    */
    async updateCryptoPayment(req: AuthenticatedRequest, res: Response) {
        const { paymentId } = req.params;
        const updateData = req.body;

        if (!paymentId) {
            return handleErrors(res, new Error('Missing payment ID'), 'Payment ID is required');
        }

        // Проверяем наличие минимально необходимых полей
        if (Object.keys(updateData).length === 0) {
            return handleErrors(res, new Error('No update data provided'), 'Update data is required');
        }

        const result = await cryptoService.updatePayment(paymentId, updateData);
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
        const result = await cryptoService.deletePayment(req.userId!, req.params.paymentId);

        if (result.success) {
            handleSuccess(res, 'Crypto payment deleted successfully');
        } else {
            handleErrors(res, new Error(result.error), 'Failed to delete crypto payment');
        }
    }
} 