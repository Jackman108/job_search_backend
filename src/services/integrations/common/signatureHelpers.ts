/**
 * Generic hash / HMAC helpers for payment signatures.
 */
import { logger } from '@utils';
import crypto, { createHmac } from 'crypto';
import { HashAlgorithm } from './hashAlgorithm.js';

/**
 * Создает хеш данных с использованием указанного алгоритма
 */
export const createDataHash = (
    data: string | Record<string, any>,
    algorithm: string = 'sha256',
    secret?: string,
): string => {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    if (secret) {
        return crypto.createHmac(algorithm, secret).update(dataString).digest('hex');
    }

    return crypto.createHash(algorithm).update(dataString).digest('hex');
};

/**
 * Нормализует данные для создания подписи
 */
export const normalizeDataForSignature = (
    data: Record<string, any>,
    options: {
        sortKeys?: boolean;
        excludeEmpty?: boolean;
        excludeKeys?: string[];
    } = {},
): Record<string, any> => {
    const { sortKeys = true, excludeEmpty = true, excludeKeys = [] } = options;

    const filteredData = Object.entries(data).reduce((result: Record<string, any>, [key, value]) => {
        if (excludeKeys.includes(key)) {
            return result;
        }

        if (excludeEmpty && (value === undefined || value === null || value === '')) {
            return result;
        }

        result[key] = value;
        return result;
    }, {});

    if (sortKeys) {
        return Object.keys(filteredData)
            .sort()
            .reduce((result: Record<string, any>, key) => {
                result[key] = filteredData[key];
                return result;
            }, {});
    }

    return filteredData;
};

/**
 * Универсальная функция для генерации подписей
 */
export const generateSignature = (
    data: any,
    secret: string,
    algorithm: HashAlgorithm = HashAlgorithm.SHA256,
): string => {
    try {
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

        if (algorithm === HashAlgorithm.SHA512) {
            return crypto.createHmac(algorithm, secret).update(dataStr).digest('hex');
        }

        return crypto
            .createHash(algorithm)
            .update(dataStr + secret)
            .digest('hex');
    } catch (error) {
        logger.error('Error generating signature', { error, algorithm });
        throw new Error(
            `Failed to generate ${algorithm} signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
};

/**
 * Создает HMAC подпись для данных с использованием указанного секрета
 */
export const createHmacSignature = (data: string, secret: string, algorithm: string = 'sha256'): string => {
    return createHmac(algorithm, secret).update(data).digest('hex');
};

/**
 * Проверяет HMAC подпись
 */
export const verifyHmacSignature = (
    data: string,
    signature: string,
    secret: string,
    algorithm: string = 'sha256',
): boolean => {
    const calculatedSignature = createHmacSignature(data, secret, algorithm);
    const isValid = calculatedSignature === signature;

    if (!isValid) {
        logger.warn('Invalid signature', {
            expected: calculatedSignature,
            received: signature,
        });
    }

    return isValid;
};
