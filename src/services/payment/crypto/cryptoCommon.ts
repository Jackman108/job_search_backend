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
 * Преобразует статус платежа из формата криптопровайдера в формат приложения
 * @param cryptoStatus Статус платежа от криптопровайдера
 * @returns Статус платежа в формате приложения
 */
export const mapCryptoStatus = (cryptoStatus: string): PaymentStatus => {
    switch (cryptoStatus) {
        case 'finished':
        case 'confirmed':
            return PaymentStatus.Completed;
        case 'waiting':
        case 'confirming':
            return PaymentStatus.Processing;
        case 'failed':
            return PaymentStatus.Failed;
        case 'refunded':
            return PaymentStatus.Refunded;
        case 'expired':
            return PaymentStatus.Expired;
        default:
            return PaymentStatus.Pending;
    }
}; 