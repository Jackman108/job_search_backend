import { CryptoPaymentDetails } from '@interface';
import { executeQuery } from '@utils';
import pool from '../../config/database.config';
import { cryptoPaymentProvider, nowPaymentsConfig } from '../../config/crypto.config';
import crypto from 'crypto';

export const createCryptoPayment = async (
    subscriptionId: string,
    amount: number,
    currency: string
): Promise<CryptoPaymentDetails> => {
    const cryptoDetails = await cryptoPaymentProvider.createPayment(amount, currency);

    const query = `
        INSERT INTO crypto_payments (
            id, subscription_id, crypto_address, crypto_amount, 
            currency, status, created_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await executeQuery(query, [
        cryptoDetails.paymentId,
        subscriptionId,
        cryptoDetails.cryptoAddress,
        cryptoDetails.cryptoAmount,
        cryptoDetails.currency,
        cryptoDetails.status,
        cryptoDetails.createdAt,
        cryptoDetails.expiresAt
    ]);

    return cryptoDetails;
};

export const checkCryptoPaymentStatus = async (
    paymentId: string
): Promise<string> => {
    const status = await cryptoPaymentProvider.checkPaymentStatus(paymentId);

    const query = `
        UPDATE crypto_payments 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
    `;
    await executeQuery(query, [status, paymentId]);

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