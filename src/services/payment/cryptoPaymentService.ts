import { CryptoPaymentData, CryptoPaymentDetails, CryptoPaymentOperations, ICryptoPaymentService, InitCryptoPaymentParams, PaymentBase, PaymentResult, PaymentStatus } from '@interface';
import { checkTableExists, executeQuery, generateUpdateQueryWithConditions, getSubscriptionIdByUserId } from '@utils';
import { withErrorHandling } from '@utils';
import { updatePaymentStatus, deletePendingWebPayPayment } from '@services';
import { cryptoPaymentProvider, USE_MOCK_PROVIDER } from '@config';
import { mockCryptoResponse } from '../../mock/mockCryptoResponse';

/**
 * Создание таблицы для криптоплатежей
 */
export const createTableCryptoPayments = async (): Promise<void> => {
    const tableExists = await checkTableExists('crypto_payments');
    if (tableExists) {
        console.log('Table "crypto_payments" already exists.');
        return;
    }
    const query = `
    CREATE TABLE IF NOT EXISTS crypto_payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) NOT NULL,
      crypto_address VARCHAR(100) NOT NULL,
      crypto_amount DECIMAL(20,8) NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP,
      transaction_hash VARCHAR(100),
      network VARCHAR(20) NOT NULL,
      wallet_provider VARCHAR(50) NOT NULL
    );
  `;

    await executeQuery(query);
};

/**
 * Получение всех криптоплатежей пользователя
 * @param userId ID пользователя
 */
export const listCryptoPayments = async (userId: string): Promise<CryptoPaymentDetails[]> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    const query = `SELECT * FROM crypto_payments WHERE subscription_id = $1;`;
    return await executeQuery<CryptoPaymentDetails>(query, [subscriptionId]);
};

/**
 * Получение активного (незавершенного) криптоплатежа
 * @param subscriptionId ID подписки
 * @param paymentId ID платежа
 */
export const getActiveCryptoPayment = async (
    subscriptionId: string,
    paymentId: string
): Promise<CryptoPaymentDetails | null> => {
    const query = `
        SELECT * FROM crypto_payments
        WHERE subscription_id = $1 AND id = $2 AND payment_status = $3
        LIMIT 1;
    `;
    const result = await executeQuery<CryptoPaymentDetails>(query, [subscriptionId, paymentId, PaymentStatus.Pending]);
    return result.length > 0 ? result[0] : null;
};

/**
 * Получение криптоплатежа по ID
 * @param userId ID пользователя
 * @param paymentId ID платежа
 */
export const getCryptoPayment = async (userId: string, paymentId: string): Promise<CryptoPaymentDetails> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = `SELECT * FROM crypto_payments WHERE subscription_id = $1 AND id = $2;`;

    const result = await executeQuery<CryptoPaymentDetails>(query, [subscriptionId, paymentId]);
    if (!result[0]) throw new Error(`Crypto payment not found for id ${paymentId}`);
    return result[0];
};

/**
 * Создание нового криптоплатежа
 * @param cryptoData Данные для создания криптоплатежа
 */
export const createCryptoPayment = async (cryptoData: CryptoPaymentData): Promise<CryptoPaymentDetails> => {
    // Проверяем существующий незавершенный платеж
    const activeCryptoPayment = await getActiveCryptoPayment(cryptoData.subscription_id, cryptoData.id);
    if (activeCryptoPayment) return activeCryptoPayment;

    // Создаем новый платеж
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 минут

    const query = `
        INSERT INTO crypto_payments (
            id, subscription_id, amount, currency, network,
            crypto_address, crypto_amount, payment_status, created_at,
            expires_at, transaction_hash, wallet_provider
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9,$10,$11)
        RETURNING *
    `;

    const values = [
        cryptoData.id,
        cryptoData.subscription_id,
        cryptoData.amount,
        cryptoData.currency || 'BTC',
        cryptoData.network || 'BTC',
        cryptoData.crypto_address ?? 'mock_address',
        cryptoData.amount,
        PaymentStatus.Pending,
        expiresAt,
        null,
        'NOWCRYPTO'
    ];

    const result = await executeQuery<CryptoPaymentDetails>(query, values);
    return result[0];
};

/**
 * Обновление криптоплатежа
 * @param paymentId ID платежа
 * @param updates Поля для обновления
 */
export const updateCryptoPayment = async (
    paymentId: string,
    updates: Partial<CryptoPaymentDetails>
): Promise<CryptoPaymentDetails> => {
    if (!updates.subscription_id) {
        throw new Error('Subscription ID is required for updating crypto payment');
    }

    // Выполняем обновление полей
    const { query, values } = generateUpdateQueryWithConditions(
        'crypto_payments',
        { ...updates, updated_at: new Date() },
        { id: paymentId }
    );
    await executeQuery(query, values);

    // Получаем обновлённую запись
    const selectQuery = `SELECT * FROM crypto_payments WHERE id = $1;`;
    const result = await executeQuery<CryptoPaymentDetails>(selectQuery, [paymentId]);
    if (!result[0]) throw new Error(`Crypto payment not found for id ${paymentId}`);
    return result[0];
};

/**
 * Удаление криптоплатежа
 * @param userId ID пользователя
 * @param paymentId ID платежа
 */
export const deleteCryptoPayment = async (
    userId: string, paymentId: string
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = `DELETE FROM crypto_payments WHERE subscription_id = $1 AND id = $2;`;
    await executeQuery(query, [subscriptionId, paymentId]);
};

/**
 * Проверяет и удаляет существующий криптоплатеж при переключении на WebPay
 * @param subscriptionId ID подписки
 */
export const deletePendingCryptoPayment = async (subscriptionId: string): Promise<void> => {
    const query = `
        DELETE FROM crypto_payments 
        WHERE subscription_id = $1 AND payment_status = $2
    `;
    await executeQuery(query, [subscriptionId, PaymentStatus.Pending]);
    console.log(`Deleted pending crypto payments for subscription: ${subscriptionId}`);
};

/**
 * Проверка статуса криптоплатежа
 * @param paymentId ID платежа
 */
export const checkCryptoPaymentStatus = async (userId: string, paymentId: string): Promise<PaymentStatus> => {
    // В режиме разработки проверяем, прошла ли 1 минута
    if (USE_MOCK_PROVIDER) {
        console.log('Using mock crypto payment status in development mode');

        const query = `SELECT * FROM crypto_payments WHERE id = $1`;
        const result = await executeQuery<CryptoPaymentDetails>(query, [paymentId]);

        if (result.length > 0) {
            const cryptoPayment = result[0];
            const createdAt = new Date(cryptoPayment.created_at);
            const now = new Date();
            const oneMinuteInMs = 60 * 1000;

            // Если прошла 1 минута, обновляем статус
            if ((now.getTime() - createdAt.getTime()) > oneMinuteInMs) {
                const status = PaymentStatus.Completed;

                // Обновляем статус в таблице crypto_payments
                await updateCryptoPayment(paymentId, {
                    payment_status: status,
                    transaction_hash: mockCryptoResponse.transaction_hash || 'mock-tx-hash',
                    subscription_id: cryptoPayment.subscription_id
                });

                // Обновляем статус в основной таблице платежей
                await updatePaymentStatus(paymentId, status);

                return status;
            }
        }

        return PaymentStatus.Pending;
    }

    // В продакшн режиме или если не прошла 1 минута
    const query = `SELECT payment_status FROM crypto_payments WHERE id = $1;`;
    const result = await executeQuery<{ payment_status: PaymentStatus }>(query, [paymentId]);
    if (!result[0]) throw new Error(`Crypto payment not found for id ${paymentId}`);

    const currentStatus = result[0].payment_status;

    // В продакшн режиме проверяем статус через провайдера
    if (!USE_MOCK_PROVIDER && currentStatus === PaymentStatus.Pending) {
        try {
            const newStatus = await cryptoPaymentProvider.checkPaymentStatus(paymentId);

            if (newStatus !== currentStatus) {
                // Обновляем статус в таблицах
                const subscriptionId = await getSubscriptionIdByUserId(userId);

                await updateCryptoPayment(paymentId, {
                    payment_status: newStatus,
                    subscription_id: subscriptionId
                });
                await updatePaymentStatus(paymentId, newStatus);

                return newStatus;
            }
        } catch (error) {
            console.error('Error checking crypto payment status:', error);
            // Возвращаем текущий статус в случае ошибки
        }
    }

    return currentStatus;
};

/**
 * Проверка подписи вебхука от криптопровайдера
 */
export const validateCryptoWebhookSignature = (data: any, signature: string): boolean => {
    // В режиме разработки всегда считаем подпись валидной
    if (USE_MOCK_PROVIDER) {
        console.log('Using mock signature validation in development mode');
        return true;
    }

    return cryptoPaymentProvider.validateSignature(data, signature);
};

/**
 * Обработка вебхука от криптопровайдера
 */
export const processCryptoWebhook = async (webhookData: any, signature: string): Promise<boolean> => {
    if (!validateCryptoWebhookSignature(webhookData, signature)) {
        throw new Error('Invalid webhook signature');
    }

    const { payment_id, payment_status, txid } = webhookData;

    // Получаем данные о платеже
    const query = `SELECT * FROM crypto_payments WHERE id = $1`;
    const result = await executeQuery<CryptoPaymentDetails>(query, [payment_id]);

    if (result.length === 0) {
        throw new Error(`Crypto payment not found for id ${payment_id}`);
    }

    const cryptoPayment = result[0];

    // Обновляем статус в таблице crypto_payments
    await updateCryptoPayment(payment_id, {
        payment_status: payment_status as PaymentStatus,
        transaction_hash: txid,
        subscription_id: cryptoPayment.subscription_id
    });

    // Обновляем статус в основной таблице платежей
    await updatePaymentStatus(payment_id, payment_status as PaymentStatus);

    // Логируем вебхук
    await executeQuery(
        `INSERT INTO webhook_logs (payment_id, payment_status, data, created_at) VALUES ($1, $2, $3, $4)`,
        [payment_id, payment_status, JSON.stringify(webhookData), new Date()]
    );

    return true;
};

/**
 * Инициализация криптоплатежа
 */
export const initCryptoPayment = async (
    params: InitCryptoPaymentParams
): Promise<PaymentResult<CryptoPaymentDetails>> => {
    return withErrorHandling(async () => {
        const { id, subscription_id, amount, currency, network } = params;

        // Удаляем существующие платежи WebPay при переключении на криптоплатеж
        await deletePendingWebPayPayment(subscription_id);

        // Генерируем данные для криптоплатежа
        const cryptoData: CryptoPaymentData = {
            id,
            subscription_id,
            amount,
            currency: currency || 'BTC',
            network: network || 'BTC'
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
                    await processCryptoWebhook({
                        payment_id: payment.id,
                        payment_status: PaymentStatus.Completed,
                        txid: 'mock-tx-' + Date.now()
                    }, 'mock-signature');
                    console.log(`Mock crypto payment ${payment.id} completed successfully`);
                } catch (error) {
                    console.error('Error processing mock webhook:', error);
                }
            }, 60000);

            return payment;
        }

        // В продакшн режиме используем реального провайдера
        const providerResponse = await cryptoPaymentProvider.createPayment({
            id,
            amount,
            currency: currency || 'BTC',
            network: network || 'BTC'
        });

        // Добавляем адрес из ответа провайдера
        cryptoData.crypto_address = providerResponse.address;

        // Создаем запись в БД
        return await createCryptoPayment(cryptoData);
    });
};

/**
 * Безопасные операции для работы с криптоплатежами
 */
export const cryptoPaymentOperations: CryptoPaymentOperations = {
    createCryptoPayment: (params) => withErrorHandling(() => createCryptoPayment(params as CryptoPaymentData)),
    getCryptoPayment: (userId, paymentId) => withErrorHandling(() => getCryptoPayment(userId, paymentId)),
    listCryptoPayments: (userId) => withErrorHandling(() => listCryptoPayments(userId)),
    updateCryptoPayment: (paymentId, updates) => withErrorHandling(() => updateCryptoPayment(paymentId, updates)),
    deleteCryptoPayment: (userId, paymentId) => withErrorHandling(() => deleteCryptoPayment(userId, paymentId)),
    checkCryptoPaymentStatus: (userId, paymentId) => withErrorHandling(() => checkCryptoPaymentStatus(userId, paymentId)),
    processWebhook: (data, signature) => withErrorHandling(() => processCryptoWebhook(data, signature))
};

/**
 * Реализация интерфейса ICryptoPaymentService
 */
export const cryptoPaymentService: ICryptoPaymentService = {
    // Реализация общего интерфейса IPaymentService
    createPayment: async (params) => {
        return withErrorHandling(async () => {
            const cryptoParams: InitCryptoPaymentParams = {
                id: params.subscription_id || '',
                subscription_id: params.subscription_id || '',
                amount: params.amount,
                currency: params.currency
            };

            const result = await initCryptoPayment(cryptoParams);
            if (!result.success || !result.data) {
                return {
                    id: '',
                    subscription_id: params.subscription_id || '',
                    amount: params.amount,
                    payment_status: PaymentStatus.Failed,
                    payment_method: 'crypto',
                    created_at: new Date(),
                    updated_at: new Date()
                } as PaymentBase;
            }

            // Явно преобразуем CryptoPaymentDetails в PaymentBase
            const paymentBase: PaymentBase = {
                id: result.data.id,
                subscription_id: result.data.subscription_id,
                amount: result.data.amount,
                payment_status: result.data.payment_status,
                payment_method: 'crypto',
                created_at: result.data.created_at,
                updated_at: new Date()
            };

            return paymentBase;
        });
    },

    updatePaymentStatus: async (paymentId, status) => {
        return withErrorHandling(async () => {
            return await updatePaymentStatus(paymentId, status);
        });
    },

    handlePaymentRedirect: async (params) => {
        return withErrorHandling(async () => {
            return '/payment/success';
        });
    },

    processPaymentWebhook: async (data, signature) => {
        return withErrorHandling(async () => {
            return await processCryptoWebhook(data, signature);
        });
    },

    // Методы специфичные для CryptoPayment
    initCryptoPayment,
    checkCryptoPaymentStatus: async (paymentId) => {
        return withErrorHandling(async () => {
            // Используем пустую строку как userId - в этом контексте нам не важен пользователь
            return await checkCryptoPaymentStatus('', paymentId);
        });
    },
    validateCryptoWebhookSignature
};