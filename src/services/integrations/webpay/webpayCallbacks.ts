import { USE_MOCK_PROVIDER } from '@config';
import { updatePaymentStatus, validateWebpaySignature } from '@integrations';
import { PaymentStatus } from '@interface';
import { getWebpayPaymentByOrderNum, updateWebpayPaymentByOrderNum } from '@services';
import { logger } from '@utils';

/**
 * Обработка возврата покупателя после успешной оплаты
 */
export const handleWebpayReturn = async (orderNum: string, transactionId: string): Promise<string> => {
    const webpayPayment = await getWebpayPaymentByOrderNum(orderNum);
    if (!webpayPayment) {
        throw new Error(`WebPay payment not found for order ${orderNum}`);
    }

    await updateWebpayPaymentByOrderNum(orderNum, {
        payment_status: PaymentStatus.Completed,
        transaction_id: transactionId,
    });

    await updatePaymentStatus(webpayPayment.payment_id, PaymentStatus.Completed);

    return (
        webpayPayment.success_url ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?order=${orderNum}`
    );
};

/**
 * Обработка возврата покупателя при отмене оплаты
 */
export const handleWebpayCancel = async (orderNum: string): Promise<string> => {
    const webpayPayment = await getWebpayPaymentByOrderNum(orderNum);
    if (!webpayPayment) {
        throw new Error(`WebPay payment not found for order ${orderNum}`);
    }

    await updateWebpayPaymentByOrderNum(orderNum, {
        payment_status: PaymentStatus.Failed,
    });

    await updatePaymentStatus(webpayPayment.payment_id, PaymentStatus.Failed);

    return (
        webpayPayment.cancel_url ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel?order=${orderNum}`
    );
};

/**
 * Обработка нотификации от WebPay
 */
export const handleWebpayNotify = async (payload: any, signature: string): Promise<boolean> => {
    if (!USE_MOCK_PROVIDER && !validateWebpaySignature(payload, signature)) {
        logger.error('Invalid WebPay notification signature');
        return false;
    }

    const { wsb_order_num, wsb_tid, wsb_status } = payload;

    if (!wsb_order_num || !wsb_status) {
        logger.error('Missing required fields in WebPay notification');
        return false;
    }

    try {
        const webpayPayment = await getWebpayPaymentByOrderNum(wsb_order_num);
        if (!webpayPayment) {
            logger.error(`WebPay payment not found for order ${wsb_order_num}`);
            return false;
        }

        const paymentStatus =
            USE_MOCK_PROVIDER || wsb_status === 'paid' ? PaymentStatus.Completed : PaymentStatus.Failed;

        await updateWebpayPaymentByOrderNum(wsb_order_num, {
            payment_status: paymentStatus,
            transaction_id: wsb_tid || null,
        });

        await updatePaymentStatus(webpayPayment.payment_id, paymentStatus);

        logger.info(`WebPay notification processed for order ${wsb_order_num}`, {
            status: paymentStatus,
            transactionId: wsb_tid,
        });

        return true;
    } catch (error) {
        logger.error('Error processing WebPay notification', { error, payload });
        return false;
    }
};

/**
 * Обработка вебхука от WebPay (mock timer path)
 */
export const processWebpayWebhook = async (orderNum: string, transactionId: string): Promise<boolean> => {
    try {
        const webpayPayment = await getWebpayPaymentByOrderNum(orderNum);
        if (!webpayPayment) {
            console.error(`WebPay payment not found for order ${orderNum}`);
            return false;
        }

        await updateWebpayPaymentByOrderNum(orderNum, {
            payment_status: PaymentStatus.Completed,
            transaction_id: transactionId,
        });

        await updatePaymentStatus(webpayPayment.payment_id, PaymentStatus.Completed);

        console.log(`Mock WebPay payment ${orderNum} completed successfully`);
        return true;
    } catch (error) {
        console.error('Error processing mock WebPay webhook:', error);
        return false;
    }
};
