import { CreatePaymentParams, CryptoPaymentData, CryptoPaymentDetails, ICryptoPaymentService, PaymentStatus } from '@interface';
import { checkTableExists, executeQuery, generateUpdateQueryWithConditions, getSubscriptionIdByUserId, withErrorHandling } from '@utils';
import crypto from 'crypto';
import { USE_MOCK_PROVIDER } from '@config';
import { logger } from '@utils';

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
 */
export const listCryptoPayments = async (): Promise<CryptoPaymentDetails[]> => {
    const query = `SELECT * FROM crypto_payments ORDER BY created_at DESC;`;
    return await executeQuery<CryptoPaymentDetails>(query);
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

    // Проверяем только если ID валидный
    if (cryptoData.id) {
        const activeCryptoPayment = await getActiveCryptoPayment(cryptoData.subscription_id, cryptoData.id);
        if (activeCryptoPayment) return activeCryptoPayment;
    }
    // Создаем новый платеж
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 минут

    const query = `
            INSERT INTO crypto_payments (
                 subscription_id, amount, currency, network,
                crypto_address, crypto_amount, payment_status, created_at,
                expires_at, transaction_hash, wallet_provider
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9,$10)
            RETURNING *
        `;

    const values = [
        cryptoData.subscription_id,
        cryptoData.amount || 0,
        cryptoData.currency || 'BTC',
        cryptoData.network || 'BTC',
        cryptoData.crypto_address ?? 'mock_address',
        cryptoData.amount || 0,
        PaymentStatus.Pending,
        expiresAt,
        null,
        'NOWCRYPTO'
    ];

    const [result] = await executeQuery<CryptoPaymentDetails>(query, values);
    return result;

};

/**
 * Получает существующий криптоплатеж по ID
 * @param paymentId ID платежа
 * @returns Детали существующего криптоплатежа или null
 */
export const getExistingCryptoPayment = async (
    paymentId: string
): Promise<CryptoPaymentDetails | null> => {
    const query = `SELECT * FROM crypto_payments WHERE id = $1 LIMIT 1;`;
    const result = await executeQuery<CryptoPaymentDetails>(query, [paymentId]);
    return result.length > 0 ? result[0] : null;
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

    // Проверяем существование платежа перед обновлением
    const currentPayment = await getExistingCryptoPayment(paymentId);

    if (!currentPayment) {
        throw new Error(`Crypto payment not found for id ${paymentId}`);
    }

    // Добавляем subscription_id из существующего платежа, если он не указан
    const updatesWithSubscription = {
        ...updates,
        subscription_id: updates.subscription_id || currentPayment.subscription_id
    };

    // Выполняем обновление полей
    const { query, values } = generateUpdateQueryWithConditions(
        'crypto_payments',
        { ...updatesWithSubscription, updated_at: new Date() },
        { id: paymentId }
    );

    await executeQuery(query, values);


    // Получаем обновлённую запись
    const result = await getExistingCryptoPayment(paymentId);
    if (!result) {
        throw new Error(`Crypto payment not found for id ${paymentId} after update`);
    }
    return result;
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
/* Реализация интерфейса ICryptoPaymentService 
 * Содержит только LCRUD операции для работы с криптоплатежами
 */
export const cryptoService: ICryptoPaymentService = {
    // Create - Создание криптоплатежа
    createPayment: async (params: CreatePaymentParams) => {
        return withErrorHandling(async () => {

            // Создаем запись в БД для криптоплатежа
            const cryptoPayment = await createCryptoPayment({
                id: params.id, // Передаем id, если он есть в params
                subscription_id: params.subscription_id,
                amount: params.amount,
                currency: params.currency || 'BTC',
                network: params.payment_method === 'crypto' ? 'BTC' : params.payment_method || 'BTC'
            });



            return cryptoPayment;

        });
    },

    // Read - Получение криптоплатежа
    getPayment: async (userId: string, paymentId: string) => {
        return withErrorHandling(async () => {
            return await getCryptoPayment(userId, paymentId);
        });
    },

    // Update - Обновление статуса криптоплатежа
    updatePayment: async (paymentId: string, params: Partial<CryptoPaymentDetails>) => {
        return withErrorHandling(async () => {
            return await updateCryptoPayment(paymentId, params);
        });
    },

    // Delete - Удаление криптоплатежа
    deletePayment: async (userId: string, paymentId: string) => {
        return withErrorHandling(async () => {
            await deleteCryptoPayment(userId, paymentId);
            return true;
        });
    },

    // List - Список всех криптоплатежей
    listPayments: async () => {
        return withErrorHandling(async () => {
            return await listCryptoPayments();
        });
    },
}; 