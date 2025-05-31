/**
 * Модуль для функций очистки платежей
 * Содержит общие функции для удаления незавершенных платежей разных типов
 */
import { PaymentResult, PaymentStatus } from '@interface';
import { executeQuery, logger } from '@utils';

/**
 * Удаляет незавершенные криптоплатежи по subscription_id
 * @param subscriptionId ID подписки
 * @returns Результат удаления
 */
export const cleanupPendingCryptoPayment = async (subscriptionId: string): Promise<PaymentResult<boolean>> => {
    try {
        logger.info('Deleting pending crypto payment', { subscriptionId });

        // Находим незавершенные платежи для указанной подписки
        const query = `
            SELECT id FROM crypto_payments 
            WHERE subscription_id = $1 
            AND payment_status = $2
        `;

        const result = await executeQuery(query, [
            subscriptionId,
            PaymentStatus.Pending
        ]);

        const rows = Array.isArray(result) ? result : [];

        if (rows.length === 0) {
            logger.info('No pending crypto payments found for subscription', { subscriptionId });
            return {
                success: true,
                data: true
            };
        }

        // Удаляем найденные платежи
        for (const row of rows) {
            logger.info('Updating crypto payment status to canceled', { paymentId: row.id });

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
        logger.error('Error deleting pending crypto payment', { error, subscriptionId });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error deleting pending crypto payment'
        };
    }
};

/**
 * Удаляет незавершенные WebPay платежи по subscription_id
 * @param subscriptionId ID подписки
 * @returns Результат удаления
 */
export const cleanupPendingWebPayPayment = async (subscriptionId: string): Promise<PaymentResult<boolean>> => {
    try {
        logger.info('Deleting pending WebPay payment', { subscriptionId });

        // Находим незавершенные платежи для указанной подписки
        const query = `
            SELECT id, wsb_order_num FROM webpay_payments 
            WHERE subscription_id = $1 
            AND payment_status = $2
        `;

        const result = await executeQuery(query, [
            subscriptionId,
            PaymentStatus.Pending
        ]);

        const rows = Array.isArray(result) ? result : [];

        if (rows.length === 0) {
            logger.info('No pending WebPay payments found for subscription', { subscriptionId });
            return {
                success: true,
                data: true
            };
        }

        // Удаляем найденные платежи
        for (const row of rows) {
            logger.info('Updating WebPay payment status to canceled', {
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
        logger.error('Error deleting pending WebPay payment', { error, subscriptionId });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error deleting pending WebPay payment'
        };
    }
}; 