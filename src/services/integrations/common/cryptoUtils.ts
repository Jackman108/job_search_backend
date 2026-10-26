/**
 * Модуль для обновления статусов платежей
 * Содержит функции для синхронизации статусов между различными таблицами платежей
 */
import { PaymentStatus } from '@interface';
import { executeQuery, logger } from '@utils';
import { updatePaymentStatus } from '@integrations';

/**
 * Получает детали криптоплатежа по ID
 * @param paymentId ID платежа
 * @returns Детали криптоплатежа или null
 */
export const getCryptoPaymentById = async (paymentId: string): Promise<any> => {
    const results = await executeQuery(
        'SELECT * FROM crypto_payments WHERE id = $1',
        [paymentId]
    );

    if (results.length === 0) {
        throw new Error(`Crypto payment not found for id ${paymentId}`);
    }

    return results[0];
};

/**
 * Обновляет статусы платежа в обеих таблицах
 * @param cryptoPaymentId ID криптоплатежа
 * @param status Новый статус
 * @param transactionHash Хеш транзакции (опционально)
 */
export const updatePaymentStatuses = async (
    cryptoPaymentId: string,
    status: PaymentStatus,
    transactionHash?: string
): Promise<void> => {
    if (!cryptoPaymentId) {
        logger.error('Missing crypto payment ID for status update');
        return;
    }

    try {
        // Обновляем статус в таблице crypto_payments
        const updateQuery = transactionHash
            ? 'UPDATE crypto_payments SET payment_status = $1, updated_at = NOW(), transaction_hash = $2 WHERE id = $3'
            : 'UPDATE crypto_payments SET payment_status = $1, updated_at = NOW() WHERE id = $2';

        const queryParams = transactionHash
            ? [status, transactionHash, cryptoPaymentId]
            : [status, cryptoPaymentId];

        await executeQuery(updateQuery, queryParams);

        // Получаем детали криптоплатежа для обновления основной таблицы
        const cryptoDetails = await getCryptoPaymentById(cryptoPaymentId);

        // Обновляем статус в основной таблице платежей
        if (cryptoDetails.payment_id) {
            await updatePaymentStatus(cryptoDetails.payment_id, status);
        }
    } catch (error) {
        logger.error('Error updating payment statuses', { error, cryptoPaymentId, status });
    }
}; 