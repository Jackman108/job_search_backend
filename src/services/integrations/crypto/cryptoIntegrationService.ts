import { USE_MOCK_PROVIDER } from '@config';
import {
    cleanupPendingWebPayPayment,
    getCryptoPaymentById,
    isValidUuid,
    nowpaymentsApi,
    updatePaymentStatuses,
    validateNowPaymentsSignature,
    withErrorHandling
} from '@integrations';
import {
    CryptoPaymentData,
    CryptoPaymentDetails,
    InitCryptoPaymentParams,
    PaymentResult,
    PaymentStatus
} from '@interface';
import {
    createCryptoPayment
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
 * Проверяет статус платежа у провайдера и обновляет записи
 * @param paymentId ID платежа
 * @returns Результат с текущим статусом платежа
 */
export const checkCryptoPaymentStatus = async (paymentId: string): Promise<PaymentResult<PaymentStatus>> => {
    return await withErrorHandling(async () => {
        logger.info('Checking crypto payment status', { paymentId });

        // Валидация формата ID платежа
        if (!isValidUuid(paymentId)) {
            throw new Error('Invalid payment ID format. Expected UUID');
        }

        // В режиме разработки используем моковые данные
        if (USE_MOCK_PROVIDER) {
            return await handleMockPaymentStatus(paymentId);
        }

        // В продакшн режиме получаем статус от NOWPayments API
        return await handleRealPaymentStatus(paymentId);
    });
};

/**
 * Обрабатывает статус платежа в режиме разработки
 * @param paymentId ID платежа
 * @returns Статус платежа
 */
const handleMockPaymentStatus = async (paymentId: string): Promise<PaymentStatus> => {
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
            const mockTxHash = mockCryptoResponse.transaction_hash || 'mock-tx-hash';

            if (paymentId) {
                await updatePaymentStatuses(paymentId, status, mockTxHash);
            }

            return status;
        }
    }

    return PaymentStatus.Pending;
};

/**
 * Обрабатывает статус платежа в продакшн режиме
 * @param paymentId ID платежа
 * @returns Статус платежа
 */
const handleRealPaymentStatus = async (paymentId: string): Promise<PaymentStatus> => {
    // Получаем детали платежа из БД для получения внешнего ID
    const cryptoPayment = await getCryptoPaymentById(paymentId);
    const externalPaymentId = cryptoPayment.transaction_hash;

    if (!externalPaymentId) {
        logger.error('Missing external payment ID for crypto payment', { paymentId });
        throw new Error('Missing external payment ID');
    }

    // Получаем статус от NOWPayments API
    const paymentStatus = await nowpaymentsApi.getPaymentStatus(externalPaymentId);
    const status = nowpaymentsApi.mapPaymentStatus(paymentStatus.payment_status);

    // Обновляем статусы в БД
    if (paymentId) {
        await updatePaymentStatuses(paymentId, status);
    }

    return status;
};

/**
 * Обрабатывает вебхук от провайдера
 * @param webhookData Данные вебхука
 * @param signature Подпись вебхука
 * @returns Результат обработки вебхука
 */
export const processWebhook = async (webhookData: any, signature: string): Promise<PaymentResult<boolean>> => {
    return await withErrorHandling(async () => {
        logger.info('Processing crypto webhook', { webhookData });

        // Проверяем подпись вебхука от NOWPayments
        if (!USE_MOCK_PROVIDER && !validateNowPaymentsSignature(webhookData, signature)) {
            logger.error('Invalid crypto webhook signature', { signature });
            throw new Error('Invalid webhook signature');
        }

        const { payment_id: nowPaymentsId, payment_status, updated_at, txid } = webhookData;

        if (!nowPaymentsId) {
            logger.error('Missing payment_id in webhook data', { webhookData });
            throw new Error('Missing payment_id in webhook data');
        }

        // Получаем криптоплатеж по внешнему ID транзакции
        const cryptoPayments = await executeQuery<CryptoPaymentDetails>(
            'SELECT * FROM crypto_payments WHERE transaction_hash = $1',
            [nowPaymentsId]
        );

        if (cryptoPayments.length === 0) {
            logger.error('Crypto payment not found for external ID', { nowPaymentsId });
            throw new Error(`Crypto payment not found for external ID ${nowPaymentsId}`);
        }

        const cryptoPayment = cryptoPayments[0];

        // Преобразуем статус из NOWPayments в наш формат
        const normalizedStatus = USE_MOCK_PROVIDER
            ? payment_status
            : nowpaymentsApi.mapPaymentStatus(payment_status);

        // Обновляем статус в таблице crypto_payments
        if (cryptoPayment.id) {
            await updatePaymentStatuses(cryptoPayment.id, normalizedStatus);
        } else {
            logger.error('Missing crypto payment ID', { nowPaymentsId });
            throw new Error('Missing crypto payment ID');
        }

        await logWebhook({
            paymentId: cryptoPayment.payment_id,
            status: normalizedStatus,
            data: webhookData
        });

        return true;
    });
};

/**
 * Логирует данные вебхука в БД
 * @param data Данные для логирования
 */
const logWebhook = async (data: { paymentId: string, status: PaymentStatus, data: any }): Promise<void> => {
    try {
        await executeQuery(
            `INSERT INTO webhook_logs 
             (payment_id, payment_status, data, created_at) 
             VALUES ($1, $2, $3, $4)`,
            [data.paymentId, data.status, JSON.stringify(data.data), new Date()]
        );
    } catch (error) {
        logger.error('Error logging webhook data', { error, data });
    }
};

/**
 * Инициализация криптоплатежа
 * @param params Параметры инициализации
 * @returns Результат с деталями созданного платежа
 */
export const initCryptoDirectPayment = async (
    params: InitCryptoPaymentParams
): Promise<PaymentResult<CryptoPaymentDetails>> => {
    return withErrorHandling(async () => {
        const { paymentId, amount, currency, network, userId } = params;

        // Удаляем существующие платежи WebPay при переключении на криптоплатеж
        await cleanupPendingWebPayPayment(paymentId);

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
            return await createMockCryptoPayment(cryptoData);
        }

        // В продакшн режиме используем NOWPayments API
        return await createRealCryptoPayment(cryptoData, userId);
    });
};

/**
 * Создает моковый криптоплатеж
 * @param cryptoData Данные для создания платежа
 * @returns Созданный платеж
 */
const createMockCryptoPayment = async (cryptoData: CryptoPaymentData): Promise<CryptoPaymentDetails> => {
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
};

/**
 * Создает реальный криптоплатеж через API
 * @param cryptoData Данные для создания платежа
 * @param userId ID пользователя
 * @returns Созданный платеж
 */
const createRealCryptoPayment = async (
    cryptoData: CryptoPaymentData,
    userId: string
): Promise<CryptoPaymentDetails> => {
    try {
        // Создаем платеж через NOWPayments API
        const apiResponse = await nowpaymentsApi.createPayment({
            price_amount: cryptoData.amount,
            price_currency: 'USD',
            pay_currency: cryptoData.currency || 'BTC',
            ipn_callback_url: `${process.env.API_URL}/api/payments/webhook/crypto`,
            order_id: cryptoData.payment_id,
            order_description: `Payment for user ${userId}`,
            is_fixed_rate: true
        });

        // Извлекаем payment_id из ответа API, с проверкой на undefined или null
        const transactionHash = apiResponse.payment_id ? String(apiResponse.payment_id) : null;

        // Создаем запись в БД
        return await createCryptoPayment({
            payment_id: cryptoData.payment_id,
            amount: cryptoData.amount,
            currency: cryptoData.currency || 'BTC',
            network: cryptoData.network || apiResponse.network || 'BTC',
            crypto_address: apiResponse.pay_address,
            crypto_amount: apiResponse.pay_amount,
            transaction_hash: transactionHash,
            payment_status: nowpaymentsApi.mapPaymentStatus(apiResponse.payment_status),
            wallet_provider: 'NOWCRYPTO',
            expires_at: apiResponse.valid_until ? new Date(apiResponse.valid_until) : undefined
        });
    } catch (error) {
        logger.error('Error creating crypto payment', { error, cryptoData });
        throw error;
    }
};

/**
 * Проверка статуса криптоплатежа
 * @param userId ID пользователя (опционально)
 * @param paymentId ID платежа
 * @returns Статус платежа
 */
export const checkUserCryptoPaymentStatus = async (userId: string, paymentId: string): Promise<PaymentStatus> => {
    // В режиме разработки проверяем, прошла ли 1 минута
    if (USE_MOCK_PROVIDER) {
        return await checkMockCryptoStatus(paymentId);
    }

    // В продакшн режиме или если не прошла 1 минута
    return await checkRealCryptoStatus(paymentId);
};

/**
 * Проверяет статус мокового криптоплатежа
 * @param paymentId ID платежа
 * @returns Статус платежа
 */
const checkMockCryptoStatus = async (paymentId: string): Promise<PaymentStatus> => {
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
            const mockTxHash = mockCryptoResponse.transaction_hash || 'mock-tx-hash';

            // Обновляем статус в таблице crypto_payments
            if (paymentId) {
                await updatePaymentStatuses(paymentId, status, mockTxHash);
            }

            return status;
        }
    }

    return PaymentStatus.Pending;
};

/**
 * Проверяет статус реального криптоплатежа
 * @param paymentId ID платежа
 * @returns Статус платежа
 */
const checkRealCryptoStatus = async (paymentId: string): Promise<PaymentStatus> => {
    const statusResults = await executeQuery<{ payment_status: PaymentStatus }>(
        `SELECT payment_status FROM crypto_payments WHERE id = $1`,
        [paymentId]
    );

    if (statusResults.length === 0) {
        throw new Error(`Crypto payment not found for id ${paymentId}`);
    }

    const currentStatus = statusResults[0].payment_status;

    // Если статус "в ожидании", проверяем через провайдера
    if (currentStatus === PaymentStatus.Pending) {
        try {
            const result = await checkCryptoPaymentStatus(paymentId);

            if (result.success && result.data && result.data !== currentStatus) {
                // Обновляем статус в таблицах
                if (paymentId) {
                    await updatePaymentStatuses(paymentId, result.data);
                }

                return result.data;
            }
        } catch (error) {
            logger.error('Error checking crypto payment status:', { error });
            // Возвращаем текущий статус в случае ошибки
        }
    }

    return currentStatus;
};
