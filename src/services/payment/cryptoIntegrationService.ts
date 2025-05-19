import { cryptoPaymentProvider, nowPaymentsConfig } from '../../config/crypto.config';
import crypto from 'crypto';
import pool from '../../config/database.config';
import { Payment } from '@interface';
import { CryptoPaymentDetails } from '@interface';
import { updatePayment } from './paymentService';

/** Проверяет подпись вебхука */
const validateWebhookSignature = (data: any, signature: string): boolean => {
    if (!nowPaymentsConfig.ipnSecret) {
        throw new Error('IPN secret is not configured');
    }
    const hmac = crypto.createHmac('sha512', nowPaymentsConfig.ipnSecret);
    const expectedSignature = hmac.update(JSON.stringify(data)).digest('hex');
    return expectedSignature === signature;
};

/** Логирует данные вебхука в БД */
const logWebhook = async (data: any): Promise<void> => {
    await pool.query(
        `INSERT INTO webhook_logs 
         (payment_id, payment_status, data, created_at) 
         VALUES ($1, $2, $3, $4)`,
        [data.paymentId, data.status, JSON.stringify(data.data), new Date()]
    );
};

/** Проверяет статус платежа у провайдера и обновляет записи */
export const checkCryptoPaymentStatus = async (paymentId: string): Promise<string> => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentId)) {
        throw new Error('Invalid payment ID format. Expected UUID');
    }

    const status = await cryptoPaymentProvider.checkPaymentStatus(paymentId);
    // Обновляем статус в таблице crypto_payments
    await pool.query(
        'UPDATE crypto_payments SET payment_status = $1, updated_at = NOW() WHERE id = $2',
        [status, paymentId]
    );

    // Получаем детали криптоплатежа
    const { rows } = await pool.query(
        'SELECT * FROM crypto_payments WHERE id = $1',
        [paymentId]
    );
    const cryptoDetails = rows[0] as CryptoPaymentDetails;
    if (!cryptoDetails) {
        throw new Error(`Crypto payment not found for id ${paymentId}`);
    }

    await updatePayment(
        cryptoDetails.subscription_id,
        paymentId,
        { payment_status: status as Payment['payment_status'] }
    );

    return status;
};

/** Обрабатывает вебхук от провайдера */
export const processWebhook = async (webhookData: any, signature: string): Promise<void> => {
    if (!validateWebhookSignature(webhookData, signature)) {
        throw new Error('Invalid webhook signature');
    }

    const { payment_id, payment_status, updated_at, txid } = webhookData;

    await pool.query(
        `UPDATE crypto_payments 
         SET payment_status = $1, 
             updated_at = $2,
             transaction_hash = $3
         WHERE id = $4`,
        [payment_status, updated_at, txid, payment_id]
    );

    await logWebhook({ paymentId: payment_id, payment_status, data: webhookData });
}; 