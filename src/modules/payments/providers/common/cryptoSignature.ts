/**
 * Crypto / NOWPayments webhook signature validation.
 */
import { nowPaymentsConfig, USE_MOCK_PROVIDER } from '@config';
import { logger } from '@utils';
import crypto from 'crypto';
import { HashAlgorithm } from './hashAlgorithm.js';

/**
 * Проверяет подпись вебхука от криптопровайдера
 */
export const validateCryptoSignature = (
    data: any,
    signature: string,
    options: { algorithm?: HashAlgorithm; logLevel?: string } = {},
): boolean => {
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

        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        const algorithm = options.algorithm || HashAlgorithm.SHA512;
        const hmac = crypto.createHmac(algorithm, ipnSecret);
        const calculatedSignature = hmac.update(dataStr).digest('hex');
        const isValid = calculatedSignature === signature;

        const logFn = options.logLevel === 'debug' ? logger.info : logger.info;
        logFn('Crypto signature validation', {
            isValid,
            algorithm,
            dataHash: crypto.createHash('md5').update(dataStr).digest('hex'),
            signatureLength: signature.length,
        });

        return isValid;
    } catch (error) {
        logger.error('Error validating crypto signature', { error });
        return false;
    }
};

/**
 * Проверяет подпись вебхука от NOWPayments
 */
export const validateNowPaymentsSignature = (data: any, signature: string): boolean => {
    const ipnSecret = nowPaymentsConfig.ipnSecret;

    if (!ipnSecret) {
        logger.error('NOWPayments IPN secret is not configured');
        return false;
    }

    try {
        const sortedData = Object.keys(data)
            .sort()
            .reduce((result: Record<string, any>, key) => {
                result[key] = data[key];
                return result;
            }, {});

        const jsonData = JSON.stringify(sortedData);
        const hmac = crypto.createHmac('sha512', ipnSecret);
        hmac.update(jsonData);
        const calculatedSignature = hmac.digest('hex');

        return calculatedSignature === signature;
    } catch (error) {
        logger.error('Error validating NOWPayments webhook signature', { error });
        return false;
    }
};

/**
 * Проверяет подпись вебхука от криптопровайдера (NOWPayments alias)
 */
export const validateCryptoWebhookSignature = (data: any, signature: string): boolean => {
    return validateNowPaymentsSignature(data, signature);
};
