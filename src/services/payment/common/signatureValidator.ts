/**
 * Модуль для функций валидации подписей
 * Содержит общие функции для проверки подписей от разных платежных систем
 */
import { nowPaymentsConfig, USE_MOCK_PROVIDER, WEBPAY_SECRET_KEY } from '@config';
import crypto from 'crypto';
import { logger } from '@utils';

/**
 * Алгоритмы хеширования для разных платежных систем
 */
export enum HashAlgorithm {
    SHA1 = 'sha1',
    SHA256 = 'sha256',
    SHA512 = 'sha512',
    MD5 = 'md5'
}

/**
 * Проверяет подпись вебхука от криптопровайдера
 * @param data Данные вебхука
 * @param signature Подпись из заголовка
 * @param options Дополнительные параметры проверки
 * @returns true если подпись валидна, иначе false
 */
export const validateCryptoSignature = (
    data: any,
    signature: string,
    options: { algorithm?: HashAlgorithm, logLevel?: string } = {}
): boolean => {
    // В режиме разработки пропускаем проверку
    if (USE_MOCK_PROVIDER) {
        logger.info('Skipping crypto signature validation in development mode');
        return true;
    }

    try {
        const ipnSecret = nowPaymentsConfig.ipnSecret;
        if (!ipnSecret) {
            logger.error('Missing IPN secret for crypto webhook validation');
            return false;
        }

        // Преобразуем данные в строку
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

        // Используем указанный алгоритм или SHA512 по умолчанию
        const algorithm = options.algorithm || HashAlgorithm.SHA512;

        // Создаем HMAC хеш
        const hmac = crypto.createHmac(algorithm, ipnSecret);
        const calculatedSignature = hmac.update(dataStr).digest('hex');

        const isValid = calculatedSignature === signature;

        // Логируем результат проверки в зависимости от уровня логирования
        const logFn = options.logLevel === 'debug' ? logger.info : logger.info;
        logFn('Crypto signature validation', {
            isValid,
            algorithm,
            dataHash: crypto.createHash('md5').update(dataStr).digest('hex'), // Безопасный хеш данных для логов
            signatureLength: signature.length
        });

        return isValid;
    } catch (error) {
        logger.error('Error validating crypto signature', { error });
        return false;
    }
};

/**
 * Проверяет подпись от WebPay
 * @param data Данные для проверки
 * @param signature Подпись для проверки
 * @param options Дополнительные параметры проверки
 * @returns true если подпись валидна, иначе false
 */
export const validateWebpaySignature = (
    data: any,
    signature: string,
    options: { algorithm?: HashAlgorithm, logLevel?: string } = {}
): boolean => {
    // В режиме разработки пропускаем проверку
    if (USE_MOCK_PROVIDER) {
        logger.info('Skipping WebPay signature validation in development mode');
        return true;
    }

    try {
        if (!WEBPAY_SECRET_KEY) {
            logger.error('Missing WebPay secret key for signature validation');
            return false;
        }

        // Формируем строку для проверки подписи
        // Формат зависит от структуры data, адаптируем по необходимости
        let signaturePayload = '';

        if (typeof data === 'string') {
            signaturePayload = data;
        } else if (data && typeof data === 'object') {
            // Для WebPay обычно используется конкатенация определенных полей
            // Пример: seed+storeid+order_num+test+currency+total+secretKey
            if (data.wsb_seed && data.wsb_storeid && data.wsb_order_num && data.wsb_currency_id && data.wsb_total) {
                signaturePayload = `${data.wsb_seed}${data.wsb_storeid}${data.wsb_order_num}${data.wsb_test || ''}${data.wsb_currency_id}${data.wsb_total}${WEBPAY_SECRET_KEY}`;
            } else {
                // Если структура отличается, пробуем преобразовать объект в строку
                signaturePayload = JSON.stringify(data) + WEBPAY_SECRET_KEY;
            }
        } else {
            logger.error('Invalid data format for WebPay signature validation');
            return false;
        }

        // Используем указанный алгоритм или SHA1 по умолчанию (типичный для WebPay)
        const algorithm = options.algorithm || HashAlgorithm.SHA1;

        // Создаем хеш для проверки подписи
        const calculatedSignature = crypto
            .createHash(algorithm)
            .update(signaturePayload)
            .digest('hex');

        const isValid = calculatedSignature === signature;

        // Логируем результат проверки
        const logFn = options.logLevel === 'debug' ? logger.info : logger.info;
        logFn('WebPay signature validation', {
            isValid,
            algorithm,
            dataHash: crypto.createHash('md5').update(signaturePayload).digest('hex'), // Безопасный хеш данных для логов
            signatureLength: signature.length
        });

        return isValid;
    } catch (error) {
        logger.error('Error validating WebPay signature', { error });
        return false;
    }
};

/**
 * Универсальная функция для генерации подписей
 * @param data Данные для подписи
 * @param secret Секретный ключ
 * @param algorithm Алгоритм хеширования
 * @returns Сгенерированная подпись
 */
export const generateSignature = (
    data: any,
    secret: string,
    algorithm: HashAlgorithm = HashAlgorithm.SHA256
): string => {
    try {
        // Преобразуем данные в строку, если это необходимо
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

        // Создаем хеш или HMAC в зависимости от алгоритма
        if (algorithm === HashAlgorithm.SHA512) {
            return crypto.createHmac(algorithm, secret).update(dataStr).digest('hex');
        } else {
            // Для прямого хеширования с солью
            return crypto.createHash(algorithm).update(dataStr + secret).digest('hex');
        }
    } catch (error) {
        logger.error('Error generating signature', { error, algorithm });
        throw new Error(`Failed to generate ${algorithm} signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}; 