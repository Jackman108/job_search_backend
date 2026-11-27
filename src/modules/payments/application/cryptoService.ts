import { getPaymentIdByUserId, withErrorHandling } from '@integrations';
import {
    CreateCryptoPaymentParams,
    CryptoPaymentData,
    CryptoPaymentDetails,
    ICryptoPaymentService,
    PaymentStatus,
    RefundPaymentParams,
} from '../../../interface/index.js';
import { checkTableExists, executeQuery, generateUpdateQueryWithConditions } from '../../../utils/index.js';
import { CRYPTO_ROW_PATCH_ALLOW, pickAllowedPatch } from '../domain/paymentPatchAllowlist.js';
import { getPayment } from './paymentService.js';
import { isPaymentsKeyedByUserId } from '../providers/common/paymentSchema.utils.js';

/**
 * Создание таблицы для криптоплатежей
 */
export const createTableCryptoPayments = async (): Promise<void> => {
    const tableExists = await checkTableExists('crypto_payments');
    if (tableExists) {
        console.log('Table "crypto_payments" already exists.');
        return;
    }
    // Match auth Prisma `payments.id` (text), not UUID — shared DB.
    const query = `
    CREATE TABLE IF NOT EXISTS crypto_payments (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      payment_id TEXT REFERENCES payments(id) ON DELETE CASCADE,
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
 * Получение криптоплатежей пользователя (JOIN payments — S1).
 */
export const listCryptoPayments = async (userId: string): Promise<CryptoPaymentDetails[]> => {
    try {
        await createTableCryptoPayments();
        if (await isPaymentsKeyedByUserId()) {
            return await executeQuery<CryptoPaymentDetails>(
                `SELECT c.* FROM crypto_payments c
                 INNER JOIN payments p ON p.id = c.payment_id
                 WHERE p.user_id = $1
                 ORDER BY c.created_at DESC;`,
                [userId],
            );
        }
        return await executeQuery<CryptoPaymentDetails>(
            `SELECT c.* FROM crypto_payments c
             INNER JOIN payments p ON p.id = c.payment_id
             INNER JOIN subscriptions s ON s.id = p.subscription_id
             WHERE s.user_id = $1
             ORDER BY c.created_at DESC;`,
            [userId],
        );
    } catch (err) {
        console.error('listCryptoPayments failed:', err);
        throw err;
    }
};

/**
 * Получение активного (незавершенного) криптоплатежа
 * @param paymentId ID платежа в таблице payments
 * @param cryptoPaymentId ID крипто платежа
 */
export const getActiveCryptoPayment = async (
    paymentId: string,
    cryptoPaymentId: string,
): Promise<CryptoPaymentDetails | null> => {
    const query = `
        SELECT * FROM crypto_payments
        WHERE payment_id = $1 AND id = $2 AND payment_status = $3
        LIMIT 1;
    `;
    const result = await executeQuery<CryptoPaymentDetails>(query, [paymentId, cryptoPaymentId, PaymentStatus.Pending]);
    return result.length > 0 ? result[0] : null;
};

/**
 * Получение криптоплатежа по ID
 * @param userId ID пользователя
 * @param cryptoPaymentId ID крипто платежа
 */
export const getCryptoPayment = async (userId: string, cryptoPaymentId: string): Promise<CryptoPaymentDetails> => {
    const paymentId = await getPaymentIdByUserId(userId);
    const query = `SELECT * FROM crypto_payments WHERE payment_id = $1 AND id = $2;`;

    const result = await executeQuery<CryptoPaymentDetails>(query, [paymentId, cryptoPaymentId]);
    if (!result[0]) throw new Error(`Crypto payment not found for id ${cryptoPaymentId}`);
    return result[0];
};

/**
 * Создание нового криптоплатежа
 * @param cryptoData Данные для создания криптоплатежа
 * @param userId optional — when set, payment_id must belong to this user (S1)
 */
export const createCryptoPayment = async (
    cryptoData: CryptoPaymentData,
    userId?: string,
): Promise<CryptoPaymentDetails> => {
    if (userId) {
        await getPayment(userId, cryptoData.payment_id);
    }

    // Проверяем только если ID валидный
    let activeCryptoPayment = null;

    if (cryptoData.id) {
        activeCryptoPayment = await getActiveCryptoPayment(cryptoData.payment_id, cryptoData.id);
    }
    if (activeCryptoPayment) return activeCryptoPayment;

    // Создаем новый платеж
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 минут

    const query = `
            INSERT INTO crypto_payments (
                 payment_id, amount, currency, network,
                crypto_address, crypto_amount, payment_status, created_at,
                expires_at, transaction_hash, wallet_provider
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *
        `;

    const values = [
        cryptoData.payment_id,
        cryptoData.amount || 0,
        cryptoData.currency || 'BTC',
        cryptoData.network || 'BTC',
        cryptoData.crypto_address ?? 'mock_address',
        cryptoData.amount || 0,
        PaymentStatus.Pending,
        new Date(),
        expiresAt,
        cryptoData.transaction_hash,
        cryptoData.wallet_provider || 'NOWCRYPTO',
    ];

    const [result] = await executeQuery<CryptoPaymentDetails>(query, values);
    return result;
};

/**
 * Получает существующий криптоплатеж по ID
 * @param paymentId ID платежа
 * @returns Детали существующего криптоплатежа или null
 */
export const getExistingCryptoPayment = async (paymentId: string): Promise<CryptoPaymentDetails | null> => {
    const query = `SELECT * FROM crypto_payments WHERE id = $1 LIMIT 1;`;
    const result = await executeQuery<CryptoPaymentDetails>(query, [paymentId]);
    return result.length > 0 ? result[0] : null;
};

/**
 * Обновление криптоплатежа (user-scoped when userId set — S1/S2).
 */
export const updateCryptoPayment = async (
    paymentId: string,
    updates: Partial<CryptoPaymentDetails>,
    userId?: string,
): Promise<CryptoPaymentDetails> => {
    const currentPayment = userId
        ? await getCryptoPayment(userId, paymentId)
        : await getExistingCryptoPayment(paymentId);

    if (!currentPayment) {
        throw new Error(`Crypto payment not found for id ${paymentId}`);
    }

    const safe = pickAllowedPatch(updates as Record<string, unknown>, CRYPTO_ROW_PATCH_ALLOW);
    if (Object.keys(safe).length === 0) {
        throw new Error('No updatable crypto fields provided');
    }

    const { query, values } = generateUpdateQueryWithConditions(
        'crypto_payments',
        safe,
        { id: paymentId },
        CRYPTO_ROW_PATCH_ALLOW,
    );

    await executeQuery(query, values);

    const result = userId ? await getCryptoPayment(userId, paymentId) : await getExistingCryptoPayment(paymentId);
    if (!result) {
        throw new Error(`Crypto payment not found for id ${paymentId} after update`);
    }
    return result;
};

/**
 * Удаление криптоплатежа
 * @param userId ID пользователя
 * @param cryptoPaymentId ID крипто платежа
 */
export const deleteCryptoPayment = async (userId: string, cryptoPaymentId: string): Promise<void> => {
    const paymentId = await getPaymentIdByUserId(userId);
    const query = `DELETE FROM crypto_payments WHERE payment_id = $1 AND id = $2;`;
    await executeQuery(query, [paymentId, cryptoPaymentId]);
};

/* Реализация интерфейса ICryptoPaymentService
 * Содержит только LCRUD операции для работы с криптоплатежами
 */
export const cryptoService: ICryptoPaymentService = {
    createPayment: async (params: CreateCryptoPaymentParams) => {
        return withErrorHandling(async () => {
            const userId = (params as CreateCryptoPaymentParams & { userId?: string }).userId;
            return await createCryptoPayment(
                {
                    payment_id: params.payment_id,
                    amount: params.amount,
                    currency: params.currency,
                    network: params.network,
                    crypto_address: params.crypto_address,
                    transaction_hash: params.transaction_hash,
                },
                userId,
            );
        });
    },

    getPayment: async (userId: string, paymentId: string) => {
        return withErrorHandling(async () => {
            return await getCryptoPayment(userId, paymentId);
        });
    },

    updatePayment: async (paymentId: string, params: Partial<CryptoPaymentDetails>) => {
        return withErrorHandling(async () => {
            const userId = (params as Partial<CryptoPaymentDetails> & { userId?: string }).userId;
            const { userId: _drop, ...rest } = params as Partial<CryptoPaymentDetails> & { userId?: string };
            return await updateCryptoPayment(paymentId, rest, userId);
        });
    },

    deletePayment: async (userId: string, paymentId: string) => {
        return withErrorHandling(async () => {
            await deleteCryptoPayment(userId, paymentId);
            return true;
        });
    },

    listPayments: async (filters?: Record<string, any>) => {
        return withErrorHandling(async () => {
            const userId = filters?.userId;
            if (!userId || typeof userId !== 'string') {
                throw new Error('userId is required to list crypto payments');
            }
            return await listCryptoPayments(userId);
        });
    },

    refundPayment: async (params: RefundPaymentParams) => {
        return withErrorHandling(async () => {
            // Status transitions stay on webhook/status helpers — not client PATCH allowlist.
            const existing = await getExistingCryptoPayment(params.paymentId);
            if (!existing) throw new Error(`Crypto payment not found for id ${params.paymentId}`);
            await executeQuery(`UPDATE crypto_payments SET payment_status = $1 WHERE id = $2`, [
                PaymentStatus.Refunded,
                params.paymentId,
            ]);
            const payment = await getExistingCryptoPayment(params.paymentId);
            if (!payment) throw new Error(`Crypto payment not found after refund ${params.paymentId}`);
            return payment;
        });
    },
};
