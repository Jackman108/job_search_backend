import { AuthenticatedRequest } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';
import { Response } from 'express';
import { webpayService } from '../../services/payment/webpay/webpayService.js';

/**
 * Контроллер для работы с WebPay платежами
 * Использует функциональный подход и обработку ошибок
 */
export class WebpayController {
    /**
     * Получение списка всех WebPay платежей
     */
    async listWebpayPayments(req: AuthenticatedRequest, res: Response) {
        const result = await webpayService.listPayments();

        if (result.success) {
            res.status(200).json(result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Failed to retrieve payments');
        }
    }

    /**
    * Получение информации о WebPay платеже по номеру заказа
    */
    async getWebpayPayment(req: AuthenticatedRequest, res: Response) {
        const result = await webpayService.getPayment(req.userId!, req.params.paymentId);

        if (result.success) {
            handleSuccess(res, 'Payment retrieved successfully', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Failed to retrieve payment');
        }

    }

    /**
    * Инициализация WebPay платежа
    */
    async createWebpayPayment(req: AuthenticatedRequest, res: Response) {
        const result = await webpayService.createPayment(req.body);

        if (result.success) {
            handleSuccess(res, 'WebPay payment initialized', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Failed to initialize WebPay payment');
        }

    }

    /**
     * Обновление WebPay платежа
     */
    async updateWebpayPayment(req: AuthenticatedRequest, res: Response) {
        const result = await webpayService.updatePayment(req.params.paymentId, req.body);

        if (result.success) {
            handleSuccess(res, 'Payment updated successfully', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Failed to update payment');
        }
    }

    /**
     * Удаление WebPay платежа
     */
    async deleteWebpayPayment(req: AuthenticatedRequest, res: Response) {
        const result = await webpayService.deletePayment(req.userId!, req.params.paymentId);

        if (result.success) {
            handleSuccess(res, 'Payment deleted successfully');
        } else {
            handleErrors(res, new Error(result.error), 'Failed to delete payment');
        }
    }

} 