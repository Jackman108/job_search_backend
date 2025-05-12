import { CryptoPaymentData, CryptoPaymentDetails } from '@interface';
import { executeQuery, generateUpdateQueryWithConditions } from '@utils';

const PENDING = 'pending';

export const CryptoPaymentRepository = {
    /** Возвращает существующий незавершенный криптоплатеж или null */
    getExistingPending: async (id: string): Promise<CryptoPaymentDetails | null> => {
        const result = await executeQuery<CryptoPaymentDetails>(
            'SELECT * FROM crypto_payments WHERE id = $1 AND status = $2',
            [id, PENDING]
        );
        return result[0] ?? null;
    },

    /** Создает новую запись о криптоплатеже с дефолтными опциями */
    create: async (data: CryptoPaymentData): Promise<CryptoPaymentDetails> => {
        const { id, subscription_id, amount, currency, network } = data;
        const expires_at = new Date(Date.now() + 30 * 60 * 1000);
        const values = [
            id,
            subscription_id,
            amount,
            currency,
            network,
            '',            // crypto_address по-умолчанию пустой
            amount,        // crypto_amount совпадает с amount
            PENDING,
            expires_at,
            null,          // transaction_hash
            'default'      // wallet_provider
        ];
        const [created] = await executeQuery<CryptoPaymentDetails>(
            `INSERT INTO crypto_payments (
                id, subscription_id, amount, currency, network,
                crypto_address, crypto_amount, status, created_at,
                expires_at, transaction_hash, wallet_provider
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9,$10,$11)
            RETURNING *`,
            values
        );
        return created;
    },

    /** Обновляет статус криптоплатежа */
    updateStatus: async (id: string, status: string): Promise<void> => {
        await executeQuery(
            'UPDATE crypto_payments SET status = $1, updated_at = NOW() WHERE id = $2',
            [status, id]
        );
    },

    /** Обновляет опции платежа и возвращает новые детали */
    updateOptions: async (
        id: string,
        updates: Partial<Pick<CryptoPaymentDetails, 'network' | 'crypto_address' | 'crypto_amount'>>
    ): Promise<CryptoPaymentDetails> => {
        const { query, values } = generateUpdateQueryWithConditions(
            'crypto_payments',
            updates,
            { id }
        );
        await executeQuery<CryptoPaymentDetails>(query, values);
        const [row] = await executeQuery<CryptoPaymentDetails>(
            'SELECT * FROM crypto_payments WHERE id = $1',
            [id]
        );
        return row;
    },

    delete: async (subscriptionId: string, paymentId: string): Promise<void> => {
        const query = `DELETE FROM crypto_payments WHERE subscription_id = $1 AND id = $2;`;
        await executeQuery(query, [subscriptionId, paymentId]);
    },


    /** Возвращает криптоплатеж по ID */
    getById: async (id: string): Promise<CryptoPaymentDetails> => {
        const result = await executeQuery<CryptoPaymentDetails>(
            'SELECT * FROM crypto_payments WHERE id = $1',
            [id]
        );
        if (!result[0]) {
            throw new Error(`Crypto payment not found for id ${id}`);
        }
        return result[0];
    }
}; 