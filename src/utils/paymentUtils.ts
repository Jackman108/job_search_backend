import { PaymentResult } from '@interface';
import { logger } from './logger';
import { USE_MOCK_PROVIDER } from '@config';

/**
 * Функция-обертка для обработки ошибок в платежных сервисах
 * @param fn Функция для выполнения
 * @returns Результат выполнения функции или объект с ошибкой
 */
export const withErrorHandling = async <T>(fn: () => Promise<T>): Promise<PaymentResult<T>> => {
    try {
        const result = await fn();
        return { success: true, data: result };
    } catch (error) {
        // Логируем ошибки только в режиме разработки
        if (USE_MOCK_PROVIDER) {
            logger.error('Payment service error:', { error });
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown payment service error'
        };
    }
};

/**
 * Генерирует уникальный номер заказа для платежей
 * @returns Уникальный идентификатор заказа
 */
export const generateOrderNumber = (): string => {
    return `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};
