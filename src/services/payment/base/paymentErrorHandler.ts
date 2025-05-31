/**
 * Общий модуль для обработки ошибок платежей
 * Предоставляет функции для единообразной обработки ошибок в платежных стратегиях
 */
import { PaymentResult } from '@interface';
import { logger } from '@utils';

/**
 * Типы ошибок платежей для более точной обработки
 */
export enum PaymentErrorType {
    VALIDATION = 'validation',
    CONNECTION = 'connection',
    PROVIDER = 'provider',
    AUTHENTICATION = 'authentication',
    DATABASE = 'database',
    UNKNOWN = 'unknown'
}

/**
 * Структура ошибки платежа с дополнительными метаданными
 */
interface PaymentError {
    message: string;
    type: PaymentErrorType;
    code?: string;
    originalError?: unknown;
}

/**
 * Определяет тип ошибки на основе сообщения или класса ошибки
 * @param error Объект ошибки
 * @returns Тип ошибки платежа
 */
const determineErrorType = (error: unknown): PaymentErrorType => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('invalid') || message.includes('validation') || message.includes('required')) {
            return PaymentErrorType.VALIDATION;
        }

        if (message.includes('connection') || message.includes('timeout') || message.includes('network')) {
            return PaymentErrorType.CONNECTION;
        }

        if (message.includes('provider') || message.includes('api')) {
            return PaymentErrorType.PROVIDER;
        }

        if (message.includes('auth') || message.includes('token') || message.includes('signature')) {
            return PaymentErrorType.AUTHENTICATION;
        }

        if (message.includes('database') || message.includes('sql') || message.includes('query')) {
            return PaymentErrorType.DATABASE;
        }
    }

    return PaymentErrorType.UNKNOWN;
};

/**
 * Форматирует объект ошибки для логирования и возврата клиенту
 * @param error Объект ошибки
 * @param context Контекст операции
 * @returns Структурированная ошибка платежа
 */
const formatPaymentError = (error: unknown, context: string): PaymentError => {
    const errorType = determineErrorType(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
        message: errorMessage,
        type: errorType,
        code: `${errorType.toUpperCase()}_${context.toUpperCase()}`,
        originalError: error
    };
};

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
        const formattedError = formatPaymentError(error, context);

        logger.error(`Error in ${paymentMethod} strategy: ${context}`, {
            error: formattedError,
            method: paymentMethod,
            context,
            timestamp: new Date().toISOString()
        });

        return {
            success: false,
            error: formattedError.message,
            errorCode: formattedError.code,
            errorType: formattedError.type
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