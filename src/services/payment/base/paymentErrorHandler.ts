/**
 * Общий модуль для обработки ошибок платежей
 * Предоставляет функции для единообразной обработки ошибок в платежных стратегиях
 */
import { PaymentResult } from '@interface';
import { logger } from '@utils';

/**
 * Создаёт обработчик ошибок для указанного платежного метода
 * @param paymentMethod Метод оплаты (webpay, crypto и т.д.)
 * @returns Функция для обработки ошибок
 */
export const createPaymentErrorHandler = (paymentMethod: string) => {
    /**
     * Преобразует ошибку в объект PaymentResult с ошибкой
     * @param error Объект ошибки
     * @param context Контекст операции для логирования
     * @returns PaymentResult с ошибкой
     */
    return <T>(error: unknown, context: string): PaymentResult<T> => {
        logger.error(`Error in ${paymentMethod} strategy: ${context}`, { error });
        return {
            success: false,
            error: error instanceof Error ? error.message : `Unknown error in ${context}`
        };
    };
};

/**
 * Выполняет операцию с платежной системой и обрабатывает ошибки
 * @param operation Функция операции
 * @param errorHandler Обработчик ошибок
 * @param context Контекст операции для логирования при ошибке
 * @returns Результат операции обернутый в PaymentResult
 */
export const withPaymentErrorHandling = async <T>(
    operation: () => Promise<T>,
    errorHandler: <E>(error: unknown, context: string) => PaymentResult<E>,
    context: string
): Promise<PaymentResult<T>> => {
    try {
        const result = await operation();
        return {
            success: true,
            data: result
        };
    } catch (error) {
        return errorHandler(error, context);
    }
}; 