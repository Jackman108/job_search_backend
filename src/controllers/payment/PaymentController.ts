import { Response } from 'express';
import { handleErrors, handleSuccess } from '@middlewares';
import { safePaymentOperations } from '@services';
import { AuthenticatedRequest, CreatePaymentParams } from '@interface';

/**
 * Контроллер для работы с платежами
 * Использует функциональный подход и обработку ошибок
 */
export class PaymentController {
    /**
     * Получение списка всех платежей пользователя
     */
    async listPayments(req: AuthenticatedRequest, res: Response) {
        const result = await safePaymentOperations.listPayments(req.userId!);

        if (result.success) {
            res.status(200).json(result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Error fetching payments');
        }
    }

    /**
     * Получение информации о конкретном платеже
     */
    async getPayment(req: AuthenticatedRequest, res: Response) {
        const result = await safePaymentOperations.getPayment(req.userId!, req.params.id);

        if (result.success) {
            res.status(200).json(result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Error fetching payment');
        }
    }

    /**
     * Создание нового платежа
     */
    async createPayment(req: AuthenticatedRequest, res: Response) {
        const { amount, currency, payment_method } = req.body;

        if (!amount) {
            return handleErrors(res, new Error('Missing required fields'), 'Amount are required');
        }

        const params: CreatePaymentParams = {
            userId: req.userId!,
            amount,
            currency: currency || 'USD',
            payment_method
        };

        const result = await safePaymentOperations.createPayment(params);

        if (result.success) {
            handleSuccess(res, 'Payment created successfully', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Error creating payment');
        }
    }

    /**
     * Обновление существующего платежа
     */
    async updatePayment(req: AuthenticatedRequest, res: Response) {
        const result = await safePaymentOperations.updatePayment(req.userId!, req.params.id, req.body);

        if (result.success) {
            handleSuccess(res, 'Payment updated successfully', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Error updating payment');
        }
    }

    /**
     * Удаление платежа
     */
    async deletePayment(req: AuthenticatedRequest, res: Response) {
        const result = await safePaymentOperations.deletePayment(req.userId!, req.params.id);

        if (result.success) {
            handleSuccess(res, 'Payment deleted successfully');
        } else {
            handleErrors(res, new Error(result.error), 'Error deleting payment');
        }
    }
}
