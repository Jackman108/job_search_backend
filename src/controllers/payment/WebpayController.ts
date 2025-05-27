import { AuthenticatedRequest, InitFiatPaymentParams } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';
import {
    getWebpayPaymentByOrderNum,
    webPayPaymentOperations,
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
        const result = await webPayPaymentOperations.listWebPay();

        if (result.success) {
            handleSuccess(res, 'Payments retrieved successfully', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Failed to retrieve payments');
        }
    }

    /**
    * Получение информации о WebPay платеже по номеру заказа
    */
    async getWebpayPayment(req: AuthenticatedRequest, res: Response) {
        const result = await webPayPaymentOperations.getWebPay(req.params.paymentId);

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
        const result = await webPayPaymentOperations.updateWebPay(req.params.paymentId, req.body);

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
        const result = await webPayPaymentOperations.deleteWebPay(req.userId!, req.params.paymentId);

        if (result.success) {
            handleSuccess(res, 'Payment deleted successfully');
        } else {
            handleErrors(res, new Error(result.error), 'Failed to delete payment');
        }
    }


    /**
     * Обработка возврата покупателя после успешной оплаты (wsb_return_url)
     */
    async handleReturn(req: AuthenticatedRequest, res: Response) {
        try {
            const { wsb_order_num, wsb_tid } = req.query;

            if (!wsb_order_num) {
                return handleErrors(res, new Error('Missing order number'), 'Order number is required');
            }

            const orderNum = wsb_order_num as string;
            const transactionId = wsb_tid ? (wsb_tid as string) : 'no-transaction-id';

            const result = await webpayService.handleWebpayReturn(orderNum, transactionId);

            if (result.success) {
                // Редиректим пользователя на страницу успешной оплаты
                return res.redirect(result.data || '/payment/success');
            } else {
                handleErrors(res, new Error(result.error), 'Failed to process payment return');
            }
        } catch (error) {
            handleErrors(res, error, 'Failed to process payment return');
        }
    }

    /**
     * Обработка возврата покупателя при отмене оплаты (wsb_cancel_return_url)
     */
    async handleCancel(req: AuthenticatedRequest, res: Response) {
        try {
            const { wsb_order_num } = req.query;

            if (!wsb_order_num) {
                return handleErrors(res, new Error('Missing order number'), 'Order number is required');
            }

            const orderNum = wsb_order_num as string;
            const result = await webpayService.handleWebpayCancel(orderNum);

            if (result.success) {
                // Редиректим пользователя на страницу отмены оплаты
                return res.redirect(result.data || '/payment/cancel');
            } else {
                handleErrors(res, new Error(result.error), 'Failed to process payment cancellation');
            }
        } catch (error) {
            handleErrors(res, error, 'Failed to process payment cancellation');
        }
    }

    /**
     * Обработка нотификатора WebPay (wsb_notify_url)
     * Реализует безопасную обработку уведомлений от WebPay с проверкой подписи
     */
    async handleNotify(req: AuthenticatedRequest, res: Response) {
        try {
            const signature = req.headers['x-webpay-signature'] as string || '';

            // Проверяем подпись
            if (!webpayService.validateWebpaySignature(req.body, signature)) {
                return handleErrors(res, new Error('Invalid signature'), 'Invalid signature');
            }

            const result = await webpayService.handleWebpayNotify(req.body, signature);

            if (result.success) {
                handleSuccess(res, 'Webhook processed successfully');
            } else {
                handleErrors(res, new Error(result.error), 'Failed to process webhook');
            }
        } catch (error) {
            handleErrors(res, error, 'Failed to process webhook');
        }
    }
} 