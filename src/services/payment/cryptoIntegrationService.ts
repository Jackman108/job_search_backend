import { cryptoPaymentProvider, nowPaymentsConfig, USE_MOCK_PROVIDER } from '@config';
import crypto from 'crypto';
import pool from '../../config/database.config';
import { PaymentBase, PaymentStatus, CryptoPaymentData, CryptoPaymentDetails } from '@interface';
import { updatePayment, createCryptoPayment } from '@services';
import { mockCryptoResponse } from '../../mock/mockCryptoResponse';

/** Проверяет подпись вебхука */
const validateWebhookSignature = (data: any, signature: string): boolean => {
    // В режиме разработки всегда считаем подпись валидной
    if (USE_MOCK_PROVIDER) {
        console.log('Using mock signature validation in development mode');
        return true;
    }

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

    // В режиме разработки возвращаем моковые данные через 1 минуту
    if (USE_MOCK_PROVIDER) {
        console.log('Using mock crypto payment status in development mode');

        // Проверяем, прошла ли 1 минута с момента создания платежа
        const { rows } = await pool.query(
            'SELECT created_at FROM crypto_payments WHERE id = $1',
            [paymentId]
        );

        if (rows.length > 0) {
            const createdAt = new Date(rows[0].created_at);
            const now = new Date();
            const oneMinuteInMs = 60 * 1000;

            // Если прошла 1 минута, обновляем статус на завершенный
            if ((now.getTime() - createdAt.getTime()) > oneMinuteInMs) {
                const status = mockCryptoResponse.payment_status;

                // Обновляем статус в таблице crypto_payments
                await pool.query(
                    'UPDATE crypto_payments SET payment_status = $1, updated_at = NOW(), transaction_hash = $2 WHERE id = $3',
                    [status, mockCryptoResponse.transaction_hash || 'mock-tx-hash', paymentId]
                );

                // Получаем детали криптоплатежа
                const cryptoResult = await pool.query(
                    'SELECT * FROM crypto_payments WHERE id = $1',
                    [paymentId]
                );
                const cryptoDetails = cryptoResult.rows[0] as CryptoPaymentDetails;

                // Обновляем статус в основной таблице платежей
                await updatePayment(
                    cryptoDetails.subscription_id,
                    paymentId,
                    { payment_status: status as PaymentBase['payment_status'] }
                );

                return status;
            }
        }
    }

    // В продакшн режиме или если не прошла 1 минута
    const status = USE_MOCK_PROVIDER ? 'pending' : await cryptoPaymentProvider.checkPaymentStatus(paymentId);

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
        { payment_status: status as PaymentBase['payment_status'] }
    );

    return status as PaymentStatus;
};

/** Создает новый криптоплатёж с моковыми данными для режима разработки */
export const createMockCryptoPayment = async (paymentDetails: Partial<CryptoPaymentDetails>): Promise<CryptoPaymentDetails> => {
    console.log('Using mock crypto payment in development mode');

    if (!paymentDetails.id || !paymentDetails.subscription_id || !paymentDetails.amount) {
        throw new Error('Missing required fields for crypto payment');
    }

    // Создаем данные для платежа
    const cryptoData: CryptoPaymentData = {
        id: paymentDetails.id,
        subscription_id: paymentDetails.subscription_id,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || 'BTC',
        network: paymentDetails.network || 'BTC',
        crypto_address: mockCryptoResponse.crypto_address
    };

    // Используем существующую функцию createCryptoPayment
    return await createCryptoPayment(cryptoData);
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