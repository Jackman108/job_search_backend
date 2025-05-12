import { CryptoPaymentData, CryptoPaymentDetails } from '@interface';
import pool from '../../config/database.config';
import { cryptoPaymentProvider, nowPaymentsConfig } from '../../config/crypto.config';
import crypto from 'crypto';
import { CryptoPaymentRepository } from '@repositories/cryptoPayment.repository';
import { PaymentRepository } from '@repositories/payment.repository';
import { Payment } from '@interface';
import { getSubscriptionIdByUserId } from './paymentService';
import { executeQuery } from '@utils';

const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    EXPIRED: 'expired'
} as const;

export const getExistingPendingPayment = CryptoPaymentRepository.getExistingPending;

/**
 * Возвращает список криптоплатежей пользователя
 */
export const listCryptoPayments = async (userId: string): Promise<CryptoPaymentDetails[]> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = 'SELECT * FROM crypto_payments WHERE subscription_id = $1';
    return await executeQuery<CryptoPaymentDetails>(query, [subscriptionId]);
};


export const createCryptoPayment = async (data: CryptoPaymentData): Promise<CryptoPaymentDetails> => {
    const existing = await CryptoPaymentRepository.getExistingPending(data.id);
    if (existing) return existing;
    return CryptoPaymentRepository.create(data);
};


export const checkCryptoPaymentStatus = async (paymentId: string): Promise<string> => {
    // Проверяем, что paymentId является валидным UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentId)) {
        throw new Error('Invalid payment ID format. Expected UUID');
    }

    // Получаем статус из провайдера и обновляем запись crypto_payments
    const status = await cryptoPaymentProvider.checkPaymentStatus(paymentId);
    await CryptoPaymentRepository.updateStatus(paymentId, status);

    // Обновляем статус в таблице payments через репозиторий
    const cryptoDetails = await CryptoPaymentRepository.getById(paymentId);
    await PaymentRepository.update(
        cryptoDetails.subscription_id,
        paymentId,
        { payment_status: status as Payment['payment_status'] }
    );

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


/**
 * Обрабатывает вебхук и логирует данные
 */
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


export const updateCryptoOptions = CryptoPaymentRepository.updateOptions;

export const deleteCryptoPayment = async (
    userId: string, paymentId: string
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    // Удаляем запись из таблицы crypto_payments
    await CryptoPaymentRepository.delete(subscriptionId, paymentId);
};