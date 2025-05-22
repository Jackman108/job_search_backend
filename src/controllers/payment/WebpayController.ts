import { AuthenticatedRequest, PaymentStatus } from '@interface';
import { Request, Response } from 'express';
import { FRONTEND_URL, USE_MOCK_PROVIDER } from '../../config/payment.config';
import { handleErrors } from '../../middlewares';
import {
    deletePendingCryptoPayment,
    getWebpayPaymentByOrderNum,
    initSimpleWebpayPayment,
    updatePayment,
    updateWebpayPaymentByOrderNum,
    validateWebpaySignature
} from '../../services';



export class WebpayController {
    /**
     * Инициализация WebPay платежа
     */
    async initWebpayPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const { subscription_id, amount, currency } = req.body;

            if (!subscription_id || !amount) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Удаляем существующие криптоплатежи при переключении на WebPay
            await deletePendingCryptoPayment(subscription_id);

            // Инициализируем WebPay платеж через упрощенную функцию
            const result = await initSimpleWebpayPayment({
                subscription_id,
                amount,
                currency: currency || 'BYN',
            });

            res.status(200).json(result);
        } catch (error) {
            handleErrors(res, error, 'Error initializing WebPay payment');
        }
    }

    /**
     * Обработка возврата покупателя после успешной оплаты (wsb_return_url)
     */
    async handleReturn(req: Request, res: Response) {
        try {
            const { wsb_order_num, wsb_tid } = req.query;
            if (!wsb_order_num || !wsb_tid) {
                return res.status(400).json({ error: 'Missing wsb_order_num or wsb_tid' });
            }

            // Получаем платеж по номеру заказа из таблицы webpay_payments
            const webpayPayment = await getWebpayPaymentByOrderNum(wsb_order_num as string);

            if (!webpayPayment) {
                throw new Error(`WebPay payment not found for order ${wsb_order_num}`);
            }

            // Обновляем статус в таблице webpay_payments
            await updateWebpayPaymentByOrderNum(wsb_order_num as string, {
                payment_status: PaymentStatus.Completed,
                transaction_id: wsb_tid as string
            });

            // Обновляем статус в основной таблице payments
            // Первый аргумент должен быть user_id, но в данном контексте его нет
            // Используем payment_id в качестве заглушки, так как функция проверяет только subscription_id
            await updatePayment(webpayPayment.payment_id, webpayPayment.payment_id, {
                payment_status: PaymentStatus.Completed
            });

            // Проверяем есть ли специальный URL для редиректа
            const redirectUrl = webpayPayment.success_url ||
                `${FRONTEND_URL}/payment/success?order=${wsb_order_num}`;

            // Редирект пользователя на фронтенд с успешным статусом
            return res.redirect(redirectUrl);
        } catch (error) {
            handleErrors(res, error, 'Error processing WebPay return');
        }
    }

    /**
     * Обработка возврата покупателя при отмене оплаты (wsb_cancel_return_url)
     */
    async handleCancel(req: Request, res: Response) {
        try {
            const { wsb_order_num } = req.query;
            if (!wsb_order_num) {
                return res.status(400).json({ error: 'Missing wsb_order_num' });
            }

            // Получаем платеж по номеру заказа из таблицы webpay_payments
            const webpayPayment = await getWebpayPaymentByOrderNum(wsb_order_num as string);

            if (!webpayPayment) {
                throw new Error(`WebPay payment not found for order ${wsb_order_num}`);
            }

            // Обновляем статус в таблице webpay_payments
            await updateWebpayPaymentByOrderNum(wsb_order_num as string, {
                payment_status: PaymentStatus.Failed
            });

            // Обновляем статус в основной таблице payments
            await updatePayment(webpayPayment.payment_id, webpayPayment.payment_id, {
                payment_status: PaymentStatus.Failed
            });

            // Проверяем есть ли специальный URL для редиректа при отмене
            const redirectUrl = webpayPayment.cancel_url ||
                `${FRONTEND_URL}/payment/cancel?order=${wsb_order_num}`;

            // Редирект пользователя на фронтенд с отмененным статусом
            return res.redirect(redirectUrl);
        } catch (error) {
            handleErrors(res, error, 'Error processing WebPay cancel');
        }
    }

    /**
     * Обработка нотификатора WebPay (wsb_notify_url)
     * Реализует безопасную обработку уведомлений от WebPay с проверкой подписи
     */
    async handleNotify(req: Request, res: Response) {
        try {
            // В режиме разработки пропускаем проверку подписи
            if (!USE_MOCK_PROVIDER) {
                const payload = req.body;
                const signature = req.headers['x-webpay-signature'] as string;

                // Проверяем подпись уведомления
                if (!signature || !validateWebpaySignature(payload, signature)) {
                    console.error('Invalid WebPay notification signature');
                    return res.status(403).send('Invalid signature');
                }
            }

            const { wsb_order_num, wsb_tid, wsb_status } = req.body;

            // Проверяем обязательные поля в нотификации
            if (!wsb_order_num || !wsb_status) {
                console.error('Missing required fields in WebPay notification');
                return res.status(400).send('Missing required fields');
            }

            // Получаем платеж по номеру заказа из таблицы webpay_payments
            const webpayPayment = await getWebpayPaymentByOrderNum(wsb_order_num);

            if (!webpayPayment) {
                console.error(`WebPay payment not found for order ${wsb_order_num}`);
                return res.status(404).send('Payment not found');
            }

            // Обновляем статус в зависимости от статуса в уведомлении
            // В режиме разработки всегда считаем платеж успешным
            const paymentStatus = USE_MOCK_PROVIDER || wsb_status === 'paid' ?
                PaymentStatus.Completed : PaymentStatus.Failed;

            // Обновляем статус в таблице webpay_payments
            await updateWebpayPaymentByOrderNum(wsb_order_num, {
                payment_status: paymentStatus,
                transaction_id: wsb_tid || null
            });

            // Обновляем статус в основной таблице payments
            await updatePayment(webpayPayment.payment_id, webpayPayment.payment_id, {
                payment_status: paymentStatus
            });

            // Обязательно отправляем 200 OK для подтверждения получения уведомления
            return res.sendStatus(200);
        } catch (error) {
            console.error('Error processing WebPay notification:', error);
            // Даже при ошибке отправляем 200 OK, чтобы WebPay не делал повторных попыток
            return res.sendStatus(200);
        }
    }
} 