/**
 * Общие функции для работы с криптоплатежами
 */
import { USE_MOCK_PROVIDER, nowPaymentsConfig } from '@config';
import { PaymentStatus } from '@interface';
import crypto from 'crypto';
import { logger } from '@utils';

/**
 * Проверяет подпись вебхука от криптопровайдера
 * @param data Данные вебхука
 * @param signature Подпись вебхука
 * @returns true если подпись валидна, иначе false
 */
export const validateCryptoWebhookSignature = (data: any, signature: string): boolean => {
    // В режиме разработки всегда считаем подпись валидной
    if (USE_MOCK_PROVIDER) {
        logger.info('Using mock signature validation in development mode');
        return true;
    }

    if (!nowPaymentsConfig.ipnSecret) {
        throw new Error('IPN secret is not configured');
    }

    const hmac = crypto.createHmac('sha512', nowPaymentsConfig.ipnSecret);
    const expectedSignature = hmac.update(JSON.stringify(data)).digest('hex');
    return expectedSignature === signature;
};

/**
 * Проверяет статус платежа у провайдера
 * @param paymentId ID платежа
 * @returns Статус платежа
 */
export const checkPaymentStatusWithProvider = async (paymentId: string): Promise<string> => {
    // В режиме разработки возвращаем моковые данные
    if (USE_MOCK_PROVIDER) {
        return PaymentStatus.Pending;
    }

    // В продакшн режиме здесь должен быть запрос к API провайдера
    // Например:
    // const response = await fetch(`${nowPaymentsConfig.baseUrl}/payment/${paymentId}`, {
    //     headers: { 'x-api-key': nowPaymentsConfig.apiKey }
    // });
    // const data = await response.json();
    // return data.payment_status;

    // Временная заглушка
    return PaymentStatus.Pending;
};

/**
 * Соответствие статусов провайдера статусам приложения
 */
const CRYPTO_STATUS_MAPPING: Record<string, PaymentStatus> = {
    // Успешные статусы
    'finished': PaymentStatus.Completed,
    'confirmed': PaymentStatus.Completed,
    'complete': PaymentStatus.Completed,
    'paid': PaymentStatus.Completed,
    'success': PaymentStatus.Completed,

    // Ожидающие статусы
    'waiting': PaymentStatus.Pending,
    'confirming': PaymentStatus.Pending,
    'pending': PaymentStatus.Pending,
    'in_progress': PaymentStatus.Processing,
    'sending': PaymentStatus.Processing,
    'received': PaymentStatus.Processing,

    // Проблемные статусы
    'failed': PaymentStatus.Failed,
    'error': PaymentStatus.Failed,
    'invalid': PaymentStatus.Failed,

    // Отмененные статусы
    'refunded': PaymentStatus.Refunded,
    'cancelled': PaymentStatus.Canceled,
    'canceled': PaymentStatus.Canceled,

    // Истекшие статусы
    'expired': PaymentStatus.Expired,
    'timeout': PaymentStatus.Expired
};

/**
 * Преобразует статус платежа из формата криптопровайдера в формат приложения
 * @param cryptoStatus Статус платежа от криптопровайдера
 * @returns Статус платежа в формате приложения
 */
export const mapCryptoStatus = (cryptoStatus: string): PaymentStatus => {
    // Нормализуем статус (приводим к нижнему регистру и удаляем пробелы)
    const normalizedStatus = cryptoStatus.toLowerCase().trim();

    // Логируем преобразование статуса
    logger.info('Mapping crypto payment status', {
        originalStatus: cryptoStatus,
        normalizedStatus
    });

    // Проверяем наличие статуса в маппинге
    if (normalizedStatus in CRYPTO_STATUS_MAPPING) {
        const mappedStatus = CRYPTO_STATUS_MAPPING[normalizedStatus];
        logger.info('Mapped crypto payment status', {
            from: normalizedStatus,
            to: mappedStatus
        });
        return mappedStatus;
    }

    // Пытаемся определить статус по частичному совпадению
    for (const [key, value] of Object.entries(CRYPTO_STATUS_MAPPING)) {
        if (normalizedStatus.includes(key)) {
            logger.info('Mapped crypto payment status by partial match', {
                from: normalizedStatus,
                partialMatch: key,
                to: value
            });
            return value;
        }
    }

    // Если статус не найден, возвращаем Pending по умолчанию
    logger.warn('Unknown crypto payment status, defaulting to Pending', {
        unknownStatus: cryptoStatus
    });
    return PaymentStatus.Pending;
}; 