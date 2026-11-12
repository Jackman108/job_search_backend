import {
    USE_MOCK_PROVIDER,
    WEBPAY_API_BASE_URL,
    WEBPAY_CANCEL_URL,
    WEBPAY_RETURN_URL,
    WEBPAY_SECRET_KEY,
} from '@config';
import {
    cleanupPendingCryptoPayment,
    generateOrderNumber,
    getPaymentByPaymentId,
    withErrorHandling,
} from '@integrations';
import {
    InitWebPayPaymentParams,
    PaymentBase,
    PaymentMethod,
    PaymentResult,
    PaymentStatus,
    WebpayInitParams,
    WebpayInitResult,
} from '@interface';
import { createWebpayPayment, updatePayment } from '@services';
import { logger } from '@utils';
import crypto from 'crypto';
import { mockWebPayResponse } from '../../../mock/mockWebPayResponse';
import { processWebpayWebhook } from './webpayCallbacks.js';

/**
 * Инициализация платежа через WebPay (Host-to-Host JSON API)
 */
export async function initWebpayDirectPayment(params: WebpayInitParams): Promise<PaymentResult<WebpayInitResult>> {
    return await withErrorHandling(async () => {
        if (USE_MOCK_PROVIDER) {
            logger.info('Using mock WebPay response in development mode');
            return {
                wt: mockWebPayResponse.wt,
                redirectUrl: mockWebPayResponse.redirectUrl,
                orderNum: params.wsb_order_num,
            };
        }

        const { wsb_seed, wsb_storeid, wsb_order_num, wsb_test, wsb_currency_id, wsb_total, ...rest } = params;

        const signaturePayload = `${wsb_seed}${wsb_storeid}${wsb_order_num}${wsb_test}${wsb_currency_id}${wsb_total}${WEBPAY_SECRET_KEY}`;
        const wsb_signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

        const requestBody = {
            wsb_seed,
            wsb_storeid,
            wsb_order_num,
            wsb_test,
            wsb_currency_id,
            wsb_total,
            wsb_signature,
            ...rest,
        };

        const response = await fetch(`${WEBPAY_API_BASE_URL}/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`WebPay API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return {
            wt: data.wt,
            redirectUrl: data.redirectUrl,
            orderNum: wsb_order_num,
        };
    });
}

/**
 * Инициализация Fiat платежа через WebPay
 */
export const initWebpayFiatPayment = async (params: InitWebPayPaymentParams): Promise<PaymentResult<any>> => {
    return withErrorHandling(async () => {
        try {
            const { userId, paymentId, currency, amount } = params;
            const orderNum = generateOrderNumber();

            const existingPayment = await getPaymentByPaymentId(paymentId);

            if (existingPayment && existingPayment.payment_status === PaymentStatus.Pending) {
                const payment: PaymentBase = await updatePayment(userId, paymentId, {
                    amount,
                    updated_at: new Date(),
                });

                if (payment.payment_method === PaymentMethod.WebPay) {
                    await cleanupPendingCryptoPayment(existingPayment.id);
                }
            }

            if (!amount || amount <= 0) {
                throw new Error('Invalid payment amount');
            }

            if (!currency || !['BYN', 'USD', 'EUR', 'RUB'].includes(currency)) {
                throw new Error(`Unsupported currency: ${currency}`);
            }

            const webpayParams: WebpayInitParams = {
                wsb_seed: Date.now().toString(),
                wsb_storeid: Number(process.env.WEBPAY_STORE_ID || '000000'),
                wsb_order_num: orderNum,
                wsb_test: USE_MOCK_PROVIDER ? 1 : 0,
                wsb_currency_id: currency as 'BYN' | 'USD' | 'EUR' | 'RUB',
                wsb_total: amount,
                wsb_version: 2,
                wsb_return_url: WEBPAY_RETURN_URL,
                wsb_cancel_return_url: WEBPAY_CANCEL_URL,
                wsb_notify_url: process.env.WEBPAY_NOTIFY_URL || 'http://localhost:8000/api/webpay/notify',
                wsb_invoice_item_name: ['Subscription'],
                wsb_invoice_item_quantity: [1],
                wsb_invoice_item_price: [amount],
                success_url: WEBPAY_RETURN_URL,
                cancel_url: WEBPAY_CANCEL_URL,
            };

            await createWebpayPayment({
                transaction_id: '',
                signature: '',
                created_at: new Date(),
                updated_at: new Date(),
                payment_id: existingPayment?.id || '',
                wsb_order_num: orderNum,
                wsb_currency_id: currency,
                wsb_total: amount,
                payment_status: PaymentStatus.Pending,
                success_url: WEBPAY_RETURN_URL,
                cancel_url: WEBPAY_CANCEL_URL,
            });

            const result = await initWebpayDirectPayment(webpayParams);

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to initialize WebPay payment');
            }

            if (USE_MOCK_PROVIDER) {
                logger.info(`WebPay payment ${orderNum} created. Will be processed in 1 minute.`);
                setTimeout(async () => {
                    try {
                        await processWebpayWebhook(orderNum, `mock-tx-${Date.now()}`);
                    } catch (error) {
                        logger.error('Error processing mock WebPay webhook:', { error });
                    }
                }, 60000);
            }

            return {
                wt: result.data.wt || '',
                redirectUrl: result.data.redirectUrl,
                orderNum: result.data.orderNum,
            };
        } catch (error) {
            logger.error('Error initializing WebPay payment', { error, params });
            throw error;
        }
    });
};
