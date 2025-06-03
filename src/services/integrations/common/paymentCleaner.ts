/**
 * Модуль для функций очистки платежей
 * Содержит общие функции для удаления незавершенных платежей разных типов
 */
import { PaymentResult, PaymentStatus } from '@interface';
import { executeQuery, logger } from '@utils';

/**
 * Удаляет незавершенные криптоплатежи по payment_id
 * @param paymentId ID платежа
 * @returns Результат удаления
 */
export const cleanupPendingCryptoPayment = async (paymentId: string): Promise<PaymentResult<boolean>> => {
    try {
        logger.info('Deleting pending crypto payment', { paymentId });

        // Находим незавершенные платежи для указанной подписки
        const query = `
            SELECT id FROM crypto_payments 
            WHERE payment_id = $1 
            AND payment_status = $2
        `;

        const result = await executeQuery(query, [
            paymentId,
            PaymentStatus.Pending
        ]);

        const rows = Array.isArray(result) ? result : [];

        if (rows.length === 0) {
            logger.info('Незавершенные криптоплатежи не найдены', { paymentId });
            return {
                success: true,
                data: true
            };
        }

        // Удаляем найденные платежи
        for (const row of rows) {
            logger.info('Обновление статуса криптоплатежа на отмененный', { paymentId: row.id });

            // Обновляем статус на отмененный
            await executeQuery(
                `UPDATE crypto_payments 
                 SET payment_status = $1, updated_at = NOW() 
                 WHERE id = $2`,
                [PaymentStatus.Canceled, row.id]
            );
        }

        return {
            success: true,
            data: true
        };
    } catch (error) {
        logger.error('Ошибка при удалении незавершенного криптоплатежа', { error, paymentId });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error deleting pending crypto payment'
        };
    }
};

/**
 * Удаляет незавершенные WebPay платежи по payment_id
 * @param paymentId ID платежа
 * @returns Результат удаления
 */
export const cleanupPendingWebPayPayment = async (paymentId: string): Promise<PaymentResult<boolean>> => {
    try {
        logger.info('Удаление незавершенного WebPay платежа', { paymentId });

        // Находим незавершенные платежи для указанного платежа
        const query = `
            SELECT id, wsb_order_num FROM webpay_payments 
            WHERE payment_id = $1 
            AND payment_status = $2
        `;

        const result = await executeQuery(query, [
            paymentId,
            PaymentStatus.Pending
        ]);

        const rows = Array.isArray(result) ? result : [];

        if (rows.length === 0) {
            logger.info('Незавершенные WebPay платежи не найдены', { paymentId });
            return {
                success: true,
                data: true
            };
        }

        // Удаляем найденные платежи
        for (const row of rows) {
            logger.info('Обновление статуса WebPay платежа на отмененный', {
                paymentId: row.id,
                orderNum: row.wsb_order_num
            });

            // Обновляем статус на отмененный
            await executeQuery(
                `UPDATE webpay_payments 
                 SET payment_status = $1, updated_at = NOW() 
                 WHERE id = $2`,
                [PaymentStatus.Canceled, row.id]
            );
        }

        return {
            success: true,
            data: true
        };
    } catch (error) {
        logger.error('Ошибка при удалении незавершенного WebPay платежа', { error, paymentId });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error deleting pending WebPay payment'
        };
    }
}; 