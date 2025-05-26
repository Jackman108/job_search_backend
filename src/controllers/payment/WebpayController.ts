import { AuthenticatedRequest, InitFiatPaymentParams } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';
import {
    getWebpayPaymentByOrderNum,
    webPayOperations,
    webpayService
} from '@services';
import { Response } from 'express';

/**
 * Контроллер для работы с WebPay платежами
 * Использует функциональный подход и обработку ошибок
 */
export class WebpayController {
    /**
     * Инициализация WebPay платежа
     */
    async initWebpayPayment(req: AuthenticatedRequest, res: Response) {

        const { amount, currency, success_url, cancel_url } = req.body;

        if (!amount) {
            return handleErrors(res, new Error('Missing required fields'), 'Amount is required');
        }

        try {
            const params: InitFiatPaymentParams = {
                userId: req.userId!,
                amount,
                currency: currency || 'BYN',
                payment_method: 'webpay',
                success_url,
                cancel_url
            };

            const result = await webpayService.initFiatPayment(params);

            if (result.success) {
                handleSuccess(res, 'WebPay payment initialized', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Failed to initialize WebPay payment');
            }
        } catch (error) {
            handleErrors(res, error, 'Failed to initialize WebPay payment');
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

            const result = await webPayOperations.handleReturn(orderNum, transactionId);

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
            const result = await webPayOperations.handleCancel(orderNum);

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

            const result = await webPayOperations.handleNotify(req.body, signature);

            if (result.success) {
                handleSuccess(res, 'Webhook processed successfully');
            } else {
                handleErrors(res, new Error(result.error), 'Failed to process webhook');
            }
        } catch (error) {
            handleErrors(res, error, 'Failed to process webhook');
        }
    }

    /**
     * Проверка статуса платежа WebPay
     */
    async checkWebpayStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const { orderNum } = req.params;

            if (!orderNum) {
                return handleErrors(res, new Error('Missing order number'), 'Order number is required');
            }

            const result = await webPayOperations.checkStatus(orderNum);

            if (result.success) {
                handleSuccess(res, 'Payment status retrieved', { status: result.data });
            } else {
                handleErrors(res, new Error(result.error), 'Failed to check payment status');
            }
        } catch (error) {
            handleErrors(res, error, 'Failed to check payment status');
        }
    }

    /**
     * Получение информации о WebPay платеже по номеру заказа
     */
    async getWebpayPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const { orderNum } = req.params;

            if (!orderNum) {
                return handleErrors(res, new Error('Missing order number'), 'Order number is required');
            }

            const payment = await getWebpayPaymentByOrderNum(orderNum);

            if (!payment) {
                return handleErrors(res, new Error('Payment not found'), 'Payment not found');
            }

            handleSuccess(res, 'Payment retrieved successfully', payment);
        } catch (error) {
            handleErrors(res, error, 'Failed to retrieve payment');
        }
    }
} 