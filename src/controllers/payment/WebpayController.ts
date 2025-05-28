import { AuthenticatedRequest, InitFiatPaymentParams } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';
import {
    getWebpayPaymentByOrderNum,
    webpayService
} from '@services';
import { Response } from 'express';

/**
 * Контроллер для работы с WebPay платежами
 * Использует функциональный подход и обработку ошибок
 */
export class WebpayController {
    /**
     * Получение списка всех WebPay платежей
     */
    async listWebpayPayments(req: AuthenticatedRequest, res: Response) {
        const result = await webpayService.listWebPay();

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
        const result = await webpayService.getWebPay(req.params.paymentId);

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
        const { amount, currency, payment_method } = req.body;

        // Используем метод createPayment из webpayService, который внутри вызывает initFiatPayment
        const result = await webpayService.createPayment({
            userId: req.userId!,
            amount: amount || 0,
            currency: currency || 'BYN',
            payment_method: payment_method || 'webpay'

        });

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
        const result = await webpayService.updateWebPay(req.params.paymentId, req.body);

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
        const result = await webpayService.deleteWebPay(req.userId!, req.params.paymentId);

        if (result.success) {
            handleSuccess(res, 'Payment deleted successfully');
        } else {
            handleErrors(res, new Error(result.error), 'Failed to delete payment');
        }
    }

} 