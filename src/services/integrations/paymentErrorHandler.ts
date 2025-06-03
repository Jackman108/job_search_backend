/**
 * Обработчик ошибок для платежных интеграций
 * Предоставляет структурированный подход к обработке ошибок платежных систем
 */
import {
    PaymentErrorDetails,
    PaymentErrorType,
    PaymentResult
} from '@interface';
import { logger } from '@utils';
import { paymentMonitoring } from '@integrations';

/**
 * Создает объект результата с ошибкой для платежных операций
 * @param error Исходная ошибка
 * @param customMessage Пользовательское сообщение об ошибке
 * @param paymentId Идентификатор платежа (если известен)
 * @returns Объект результата с ошибкой
 */
export const createPaymentError = <T>(
    error: any,
    customMessage: string = 'Ошибка платежной операции',
    paymentId?: string
): PaymentResult<T> => {
    // Определяем тип ошибки и дополнительные данные
    const errorDetails = analyzePaymentError(error);

    // Формируем сообщение об ошибке
    const errorMessage = errorDetails.message || customMessage;

    // Логируем ошибку
    logger.error(`Payment error: ${errorMessage}`, {
        type: errorDetails.type,
        code: errorDetails.code,
        context: errorDetails.context,
        originalError: error
    });

    // Регистрируем ошибку в мониторинге, если известен ID платежа
    if (paymentId) {
        paymentMonitoring.registerFailure(paymentId, errorDetails.code || errorDetails.type);
    }

    // Формируем результат с ошибкой
    return {
        success: false,
        error: errorMessage,
        errorCode: errorDetails.code || errorDetails.type,
        errorType: errorDetails.type,
        details: {
            recoverable: errorDetails.recoverable,
            retryable: errorDetails.retryable,
            context: errorDetails.context
        }
    };
};

/**
 * Анализирует ошибку и определяет ее тип, код и другие детали
 * @param error Исходная ошибка
 * @returns Структурированные данные об ошибке
 */
export const analyzePaymentError = (error: any): PaymentErrorDetails => {
    // Если ошибка уже проанализирована, возвращаем как есть
    if (isPaymentErrorDetails(error)) {
        return error;
    }

    // Базовая структура для результата
    const result: PaymentErrorDetails = {
        message: '',
        type: PaymentErrorType.Unknown,
        recoverable: false,
        retryable: false
    };

    // Если это Error или строка, получаем сообщение
    if (error instanceof Error) {
        result.message = error.message;
        result.originalError = error;
    } else if (typeof error === 'string') {
        result.message = error;
    } else if (error && typeof error === 'object') {
        // Пытаемся извлечь информацию из объекта ошибки
        result.message = error.message || error.error || 'Неизвестная ошибка платежа';
        result.code = error.code || error.errorCode;
        result.context = error.details || error.context || {};
        result.originalError = error;
    } else {
        result.message = 'Неизвестная ошибка платежа';
    }

    // Определяем тип ошибки на основе сообщения и кода
    if (result.code) {
        result.type = mapErrorCodeToType(result.code);
    } else {
        result.type = detectErrorTypeFromMessage(result.message);
    }

    // Определяем возможность восстановления и повторения
    result.recoverable = isRecoverableError(result.type);
    result.retryable = isRetryableError(result.type);

    return result;
};

/**
 * Проверяет, является ли объект структурой данных ошибки платежа
 * @param obj Объект для проверки
 * @returns true, если объект является структурой данных ошибки платежа
 */
const isPaymentErrorDetails = (obj: any): obj is PaymentErrorDetails => {
    return obj &&
        typeof obj === 'object' &&
        typeof obj.message === 'string' &&
        typeof obj.type === 'string' &&
        typeof obj.recoverable === 'boolean' &&
        typeof obj.retryable === 'boolean';
};

/**
 * Сопоставляет код ошибки с типом ошибки
 * @param code Код ошибки
 * @returns Тип ошибки
 */
const mapErrorCodeToType = (code: string): PaymentErrorType => {
    const codeLower = code.toLowerCase();

    if (codeLower.includes('network') || codeLower.includes('connect')) {
        return PaymentErrorType.Network;
    } else if (codeLower.includes('auth') || codeLower.includes('token') || codeLower.includes('key')) {
        return PaymentErrorType.Authentication;
    } else if (codeLower.includes('validate') || codeLower.includes('invalid')) {
        return PaymentErrorType.Validation;
    } else if (codeLower.includes('rate') || codeLower.includes('limit')) {
        return PaymentErrorType.RateLimit;
    } else if (codeLower.includes('server') || codeLower.includes('500')) {
        return PaymentErrorType.ServerError;
    } else if (codeLower.includes('funds') || codeLower.includes('balance')) {
        return PaymentErrorType.InsufficientFunds;
    } else if (codeLower.includes('timeout')) {
        return PaymentErrorType.Timeout;
    } else if (codeLower.includes('duplicate') || codeLower.includes('already')) {
        return PaymentErrorType.Duplicate;
    } else if (codeLower.includes('decline') || codeLower.includes('reject')) {
        return PaymentErrorType.Declined;
    }

    return PaymentErrorType.Unknown;
};

/**
 * Определяет тип ошибки на основе сообщения
 * @param message Сообщение об ошибке
 * @returns Тип ошибки
 */
const detectErrorTypeFromMessage = (message: string): PaymentErrorType => {
    const messageLower = message.toLowerCase();

    if (messageLower.includes('network') || messageLower.includes('connect') || messageLower.includes('socket')) {
        return PaymentErrorType.Network;
    } else if (messageLower.includes('timeout') || messageLower.includes('timed out')) {
        return PaymentErrorType.Timeout;
    } else if (messageLower.includes('auth') || messageLower.includes('token') || messageLower.includes('key') || messageLower.includes('unauthorized')) {
        return PaymentErrorType.Authentication;
    } else if (messageLower.includes('validate') || messageLower.includes('invalid') || messageLower.includes('required')) {
        return PaymentErrorType.Validation;
    } else if (messageLower.includes('rate') || messageLower.includes('limit') || messageLower.includes('too many')) {
        return PaymentErrorType.RateLimit;
    } else if (messageLower.includes('server') || messageLower.includes('internal')) {
        return PaymentErrorType.ServerError;
    } else if (messageLower.includes('funds') || messageLower.includes('balance') || messageLower.includes('insufficient')) {
        return PaymentErrorType.InsufficientFunds;
    } else if (messageLower.includes('duplicate') || messageLower.includes('already')) {
        return PaymentErrorType.Duplicate;
    } else if (messageLower.includes('decline') || messageLower.includes('reject') || messageLower.includes('denied')) {
        return PaymentErrorType.Declined;
    }

    return PaymentErrorType.Unknown;
};

/**
 * Проверяет, можно ли восстановиться после ошибки
 * @param errorType Тип ошибки
 * @returns true, если возможно восстановление
 */
const isRecoverableError = (errorType: PaymentErrorType): boolean => {
    // Ошибки, после которых можно восстановить платеж
    const recoverableErrors = [
        PaymentErrorType.Network,
        PaymentErrorType.RateLimit,
        PaymentErrorType.ServerError,
        PaymentErrorType.Timeout
    ];

    return recoverableErrors.includes(errorType);
};

/**
 * Проверяет, можно ли повторить операцию после ошибки
 * @param errorType Тип ошибки
 * @returns true, если возможно повторение
 */
const isRetryableError = (errorType: PaymentErrorType): boolean => {
    // Ошибки, после которых можно повторить операцию
    const retryableErrors = [
        PaymentErrorType.Network,
        PaymentErrorType.RateLimit,
        PaymentErrorType.ServerError,
        PaymentErrorType.Timeout
    ];

    return retryableErrors.includes(errorType);
}; 