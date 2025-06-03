import { USE_MOCK_PROVIDER } from '@config';
import {
    checkPaymentStatusWithProvider,
    updatePaymentStatus,
    validateCryptoWebhookSignature,
    withErrorHandling
} from '@integrations';
import {
    CryptoPaymentData,
    CryptoPaymentDetails,
    InitCryptoPaymentParams,
    PaymentBase,
    PaymentResult,
    PaymentStatus
} from '@interface';
import {
    createCryptoPayment,
    deletePendingWebPayPayment,
    updateCryptoPayment,
    updatePayment,
} from '@services';
import { executeQuery, logger } from '@utils';
import { mockCryptoResponse } from '../../../mock/mockCryptoResponse';


/**
 * @module CryptoIntegrationService
 * @description Интеграция с API криптоплатежей
 * Этот модуль содержит функции для:
 * - Инициализации криптоплатежей
 * - Обработки вебхуков от провайдера
 * - Проверки статуса платежей
 */


/**
 * Получает криптоплатеж по ID
 * @param paymentId ID платежа
 * @returns Детали криптоплатежа или null
 */
export const getCryptoPaymentById = async (paymentId: string): Promise<CryptoPaymentDetails> => {
    const results = await executeQuery<CryptoPaymentDetails>(
        'SELECT * FROM crypto_payments WHERE id = $1',
        [paymentId]
    );

    if (results.length === 0) {
        throw new Error(`Crypto payment not found for id ${paymentId}`);
    }

    return results[0];
};

/** Проверяет статус платежа у провайдера и обновляет записи */
export const checkCryptoPaymentStatus = async (paymentId: string): Promise<PaymentResult<PaymentStatus>> => {
    return await withErrorHandling(async () => {
        if (USE_MOCK_PROVIDER) {
            logger.info('Checking crypto payment status', { paymentId });
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(paymentId)) {
            throw new Error('Invalid payment ID format. Expected UUID');
        }

        // В режиме разработки возвращаем моковые данные через 1 минуту
        if (USE_MOCK_PROVIDER) {
            logger.info('Using mock crypto payment status in development mode');

            // Проверяем, прошла ли 1 минута с момента создания платежа
            const createdAtResults = await executeQuery(
                'SELECT created_at FROM crypto_payments WHERE id = $1',
                [paymentId]
            );

            if (createdAtResults.length > 0) {
                const createdAt = new Date(createdAtResults[0].created_at);
                const now = new Date();
                const oneMinuteInMs = 60 * 1000;

                // Если прошла 1 минута, обновляем статус на завершенный
                if ((now.getTime() - createdAt.getTime()) > oneMinuteInMs) {
                    const status = mockCryptoResponse.payment_status;

                    // Обновляем статус в таблице crypto_payments
                    await executeQuery(
                        'UPDATE crypto_payments SET payment_status = $1, updated_at = NOW(), transaction_hash = $2 WHERE id = $3',
                        [status, mockCryptoResponse.transaction_hash || 'mock-tx-hash', paymentId]
                    );

                    // Получаем детали криптоплатежа
                    const cryptoDetails = await getCryptoPaymentById(paymentId);

                    // Обновляем статус в основной таблице платежей
                    await updatePayment(
                        cryptoDetails.payment_id,
                        paymentId,
                        { payment_status: status as PaymentBase['payment_status'] }
                    );

                    return status as PaymentStatus;
                }
            }
        }

        // В продакшн режиме или если не прошла 1 минута
        const status = USE_MOCK_PROVIDER ? 'pending' : await checkPaymentStatusWithProvider(paymentId);

        // Обновляем статус в таблице crypto_payments
        await executeQuery(
            'UPDATE crypto_payments SET payment_status = $1, updated_at = NOW() WHERE id = $2',
            [status, paymentId]
        );

        // Получаем детали криптоплатежа
        const cryptoDetails = await getCryptoPaymentById(paymentId);
        if (!cryptoDetails) {
            throw new Error(`Crypto payment not found for id ${paymentId}`);
        }

        await updatePayment(
            cryptoDetails.payment_id,
            paymentId,
            { payment_status: status as PaymentBase['payment_status'] }
        );

        return status as PaymentStatus;
    });
};

/** Обрабатывает вебхук от провайдера */
export const processWebhook = async (webhookData: any, signature: string): Promise<PaymentResult<boolean>> => {
    return await withErrorHandling(async () => {
        if (USE_MOCK_PROVIDER) {
            logger.info('Processing crypto webhook', { webhookData });
        }

        if (!validateCryptoWebhookSignature(webhookData, signature)) {
            if (USE_MOCK_PROVIDER) {
                logger.error('Invalid crypto webhook signature', { signature });
            }
            throw new Error('Invalid webhook signature');
        }

        const { payment_id, payment_status, updated_at, txid } = webhookData;

        await executeQuery(
            `UPDATE crypto_payments 
             SET payment_status = $1, 
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

        return true;
    });
};

/** Логирует данные вебхука в БД */
const logWebhook = async (data: any): Promise<void> => {
    try {
        await executeQuery(
            `INSERT INTO webhook_logs 
             (payment_id, payment_status, data, created_at) 
             VALUES ($1, $2, $3, $4)`,
            [data.paymentId, data.status, JSON.stringify(data.data), new Date()]
        );
    } catch (error) {
        if (USE_MOCK_PROVIDER) {
            logger.error('Error logging webhook data', { error, data });
        }
    }
};

/** Инициализация криптоплатежа */
export const initCryptoDirectPayment = async (
    params: InitCryptoPaymentParams
): Promise<PaymentResult<CryptoPaymentDetails>> => {
    return withErrorHandling(async () => {
        const { paymentId, amount, currency, network } = params;

        // Удаляем существующие платежи WebPay при переключении на криптоплатеж
        await deletePendingWebPayPayment(paymentId);

        // Генерируем данные для криптоплатежа
        const cryptoData: CryptoPaymentData = {
            payment_id: paymentId,
            amount,
            currency: currency || 'BTC',
            network: network || 'BTC',
            wallet_provider: 'NOWCRYPTO'
        };

        // В режиме разработки используем моковые данные
        if (USE_MOCK_PROVIDER) {
            // Добавляем моковый адрес
            cryptoData.crypto_address = mockCryptoResponse.crypto_address;

            // Создаем запись в БД
            const payment = await createCryptoPayment(cryptoData);

            // Запускаем обработку вебхука через минуту
            setTimeout(async () => {
                try {
                    await processWebhook({
                        payment_id: payment.id,
                        payment_status: PaymentStatus.Completed,
                        txid: 'mock-tx-' + Date.now()
                    }, 'mock-signature');
                    logger.info(`Mock crypto payment ${payment.id} completed successfully`);
                } catch (error) {
                    logger.error('Error processing mock webhook:', { error });
                }
            }, 60000);

            return payment;
        }

        // В продакшн режиме используем реального провайдера
        try {
            // Создаем запись в БД
            return await createCryptoPayment({
                payment_id: paymentId,
                amount: amount,
                currency: currency || 'BTC',
                network: network || 'BTC',
                crypto_address: 'provider_crypto_address', // Будет заменен провайдером
                wallet_provider: 'NOWCRYPTO'
            });
        } catch (error) {
            logger.error('Error creating crypto payment', { error, params });
            throw error;
        }
    });
};

/** Проверка статуса криптоплатежа */
export const checkUserCryptoPaymentStatus = async (userId: string, paymentId: string): Promise<PaymentStatus> => {
    // В режиме разработки проверяем, прошла ли 1 минута
    if (USE_MOCK_PROVIDER) {
        logger.info('Using mock crypto payment status in development mode');

        const cryptoPayments = await executeQuery<CryptoPaymentDetails>(
            `SELECT * FROM crypto_payments WHERE id = $1`,
            [paymentId]
        );

        if (cryptoPayments.length > 0) {
            const cryptoPayment = cryptoPayments[0];
            const createdAt = new Date(cryptoPayment.created_at || new Date());
            const now = new Date();
            const oneMinuteInMs = 60 * 1000;

            // Если прошла 1 минута, обновляем статус
            if ((now.getTime() - createdAt.getTime()) > oneMinuteInMs) {
                const status = PaymentStatus.Completed;

                // Обновляем статус в таблице crypto_payments
                await updateCryptoPayment(paymentId, {
                    payment_status: status,
                    transaction_hash: mockCryptoResponse.transaction_hash || 'mock-tx-hash',
                    payment_id: cryptoPayment.payment_id
                });

                // Обновляем статус в основной таблице платежей
                await updatePaymentStatus(paymentId, status);

                return status;
            }
        }

        return PaymentStatus.Pending;
    }

    // В продакшн режиме или если не прошла 1 минута
    const statusResults = await executeQuery<{ payment_status: PaymentStatus }>(
        `SELECT payment_status FROM crypto_payments WHERE id = $1`,
        [paymentId]
    );

    if (statusResults.length === 0) {
        throw new Error(`Crypto payment not found for id ${paymentId}`);
    }

    const currentStatus = statusResults[0].payment_status;

    // В продакшн режиме проверяем статус через провайдера
    if (!USE_MOCK_PROVIDER && currentStatus === PaymentStatus.Pending) {
        try {
            const result = await checkCryptoPaymentStatus(paymentId);

            if (result.success && result.data && result.data !== currentStatus) {
                // Обновляем статус в таблицах

                await updateCryptoPayment(paymentId, {
                    payment_status: result.data,
                    payment_id: paymentId
                });
                await updatePaymentStatus(paymentId, result.data);

                return result.data;
            }
        } catch (error) {
            logger.error('Error checking crypto payment status:', { error });
            // Возвращаем текущий статус в случае ошибки
        }
    }

    return currentStatus;
};
