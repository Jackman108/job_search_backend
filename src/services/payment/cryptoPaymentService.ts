import { executeQuery, generateUpdateQueryWithConditions } from '@utils';
import { CryptoPaymentData, CryptoPaymentDetails } from '@interface';
import pool from '../../config/database.config';
import { cryptoPaymentProvider, nowPaymentsConfig } from '../../config/crypto.config';
import crypto from 'crypto';

const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    EXPIRED: 'expired'
} as const;

export const getExistingPendingPayment = async (paymentId: string): Promise<CryptoPaymentDetails | null> => {
    try {
        const result = await executeQuery<CryptoPaymentDetails>(
            `SELECT * FROM crypto_payments 
             WHERE id = $1 AND status = $2`,
            [paymentId, PAYMENT_STATUS.PENDING]
        );
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error checking existing payment:', error);
        throw new Error('Failed to check existing payment');
    }
};

export const createCryptoPayment = async (data: CryptoPaymentData): Promise<CryptoPaymentDetails> => {
    try {
        const { id, subscription_id, amount, currency, network } = data;

        // Проверяем существование незавершенного платежа
        const existingPayment = await getExistingPendingPayment(id);
        if (existingPayment) {
            return existingPayment;
        }

        // Создаем новую запись только если нет существующего платежа
        const result = await executeQuery<CryptoPaymentDetails>(
            `INSERT INTO crypto_payments (
                id, subscription_id, amount, currency, network,
                crypto_address, crypto_amount, status, created_at,
                expires_at, transaction_hash, wallet_provider
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11)
            RETURNING *`,
            [
                id,
                subscription_id,
                amount,
                currency,
                network,
                'pending',
                amount,
                PAYMENT_STATUS.PENDING,
                new Date(Date.now() + 30 * 60 * 1000),
                null,
                'default'
            ]
        );

        if (!result || result.length === 0) {
            throw new Error('Failed to create crypto payment record');
        }

        return result[0];
    } catch (error) {
        console.error('Error creating crypto payment:', error);
        throw new Error('Failed to create crypto payment');
    }
};

export const checkCryptoPaymentStatus = async (
    paymentId: string
): Promise<string> => {
    // Проверяем, что paymentId является валидным UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentId)) {
        throw new Error('Invalid payment ID format. Expected UUID');
    }

    const status = await cryptoPaymentProvider.checkPaymentStatus(paymentId);

    // Обновляем статус в обеих таблицах
    const cryptoQuery = `
        UPDATE crypto_payments 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
    `;
    await executeQuery(cryptoQuery, [status, paymentId]);

    const paymentQuery = `
        UPDATE payments p
        SET payment_status = $1, updated_at = NOW()
        FROM crypto_payments cp
        WHERE cp.payment_id = p.id AND cp.id = $2
    `;
    await executeQuery(paymentQuery, [status, paymentId]);

    return status;
};

const validateWebhookSignature = (data: any, signature: string): boolean => {
    if (!nowPaymentsConfig.ipnSecret) {
        throw new Error('IPN secret is not configured');
    }
    const hmac = crypto.createHmac('sha512', nowPaymentsConfig.ipnSecret);
    const expectedSignature = hmac.update(JSON.stringify(data)).digest('hex');
    return expectedSignature === signature;
};

const updateSubscriptionStatus = async (subscriptionId: string): Promise<void> => {
    await pool.query(
        'UPDATE subscriptions SET status = $1 WHERE id = $2',
        ['active', subscriptionId]
    );
};

export const processWebhook = async (webhookData: any, signature: string): Promise<void> => {
    if (!validateWebhookSignature(webhookData, signature)) {
        throw new Error('Invalid webhook signature');
    }

    const {
        payment_id,
        payment_status,
        pay_address,
        pay_amount,
        pay_currency,
        order_id,
        created_at,
        updated_at,
        txid
    } = webhookData;

    await pool.query(
        `UPDATE crypto_payments 
         SET status = $1, 
             updated_at = $2,
             transaction_hash = $3
         WHERE id = $4`,
        [payment_status, updated_at, txid, payment_id]
    );

    if (payment_status === 'finished') {
        await updateSubscriptionStatus(order_id);
    }

    await logWebhook({
        paymentId: payment_id,
        status: payment_status,
        data: webhookData
    });
};

const logWebhook = async (data: any): Promise<void> => {
    await pool.query(
        `INSERT INTO webhook_logs 
         (payment_id, status, data, created_at) 
         VALUES ($1, $2, $3, $4)`,
        [data.paymentId, data.status, JSON.stringify(data.data), new Date()]
    );
};

export const updateCryptoOptions = async (
    paymentId: string,
    updates: { network?: string; crypto_address?: string; crypto_amount?: string }
): Promise<CryptoPaymentDetails> => {
    const { query, values } = generateUpdateQueryWithConditions(
        'crypto_payments',
        updates,
        { id: paymentId }
    );
    await executeQuery<CryptoPaymentDetails>(query, values);
    const [row] = await executeQuery<CryptoPaymentDetails>(
        'SELECT * FROM crypto_payments WHERE id = $1',
        [paymentId]
    );
    return row;
}; 