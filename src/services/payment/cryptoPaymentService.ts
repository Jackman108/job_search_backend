import { CryptoPaymentData, CryptoPaymentDetails } from '@interface';
import { checkTableExists, executeQuery, generateUpdateQueryWithConditions, getSubscriptionIdByUserId } from '@utils';

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
      created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, 
      updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      transaction_hash VARCHAR(100),
      network VARCHAR(20) NOT NULL,
      wallet_provider VARCHAR(50) NOT NULL
    );
  `;

    await executeQuery(query);
};

// CRUD-операции для работы с таблицей crypto_payments
export const listCryptoPayments = async (userId: string): Promise<CryptoPaymentDetails[]> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    const query = `SELECT * FROM crypto_payments WHERE subscription_id = $1;`;
    return await executeQuery<CryptoPaymentDetails>(query, [subscriptionId]);
};

export const getActiveCryptoPayment = async (
    subscriptionId: string,
    paymentId: string
): Promise<CryptoPaymentDetails[]> => {
    // Возвращает незавершённый криптоплатёж по подписке и ID
    const query = `
        SELECT * FROM crypto_payments
        WHERE subscription_id = $1 AND id = $2 AND payment_status = $3;
    `;
    return await executeQuery<CryptoPaymentDetails>(query, [subscriptionId, paymentId, 'pending']);
};

export const getCryptoPayment = async (userId: string, paymentId: string): Promise<CryptoPaymentDetails> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = `SELECT * FROM crypto_payments WHERE subscription_id = $1 AND id = $2;`;

    const result = await executeQuery<CryptoPaymentDetails>(query, [subscriptionId, paymentId]);
    return result[0];
};

export const createCryptoPayment = async (cryptoData: CryptoPaymentData): Promise<CryptoPaymentDetails> => {
    // Проверяем существующий незавершенный платеж
    const activeCryptoPayment = await getActiveCryptoPayment(cryptoData.subscription_id, cryptoData.id);
    if (activeCryptoPayment[0]) return activeCryptoPayment[0];
    // Создаем новый платеж
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

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
        cryptoData.currency,
        cryptoData.network,
        cryptoData.crypto_address ?? '',
        cryptoData.amount,
        'pending',
        expiresAt,
        null,
        'NOWCRYPTO'
    ];

    const result = await executeQuery<CryptoPaymentDetails>(query, values);
    return result[0];
};

export const updateCryptoPayment = async (
    paymentId: string,
    updates: Partial<CryptoPaymentDetails>
): Promise<CryptoPaymentDetails> => {
    // Выполняем обновление полей
    const { query, values } = generateUpdateQueryWithConditions(
        'crypto_payments',
        updates,
        { subscription_id: updates.subscription_id!, id: paymentId }
    );
    await executeQuery(query, values);
    // Получаем обновлённую запись
    const selectQuery = `SELECT * FROM crypto_payments WHERE subscription_id = $1 AND id = $2;`;
    const result = await executeQuery<CryptoPaymentDetails>(selectQuery, [updates.subscription_id!, paymentId]);
    return result[0];
};

export const deleteCryptoPayment = async (
    userId: string, paymentId: string
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = `DELETE FROM crypto_payments WHERE subscription_id = $1 AND id = $2;`;
    await executeQuery<CryptoPaymentDetails>(query, [subscriptionId, paymentId]);
};