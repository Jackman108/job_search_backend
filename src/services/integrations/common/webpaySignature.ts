/**
 * WebPay signature validation.
 */
import { USE_MOCK_PROVIDER, WEBPAY_SECRET_KEY } from '@config';
import { logger } from '@utils';
import crypto from 'crypto';
import { HashAlgorithm } from './hashAlgorithm.js';

/**
 * Проверяет подпись от WebPay
 */
export const validateWebpaySignature = (
    data: any,
    signature: string,
    options: { algorithm?: HashAlgorithm; logLevel?: string } = {},
): boolean => {
    if (USE_MOCK_PROVIDER) {
        logger.info('Skipping WebPay signature validation in development mode');
        return true;
    }

    try {
        if (!WEBPAY_SECRET_KEY) {
            logger.error('Missing WebPay secret key for signature validation');
            return false;
        }

        let signaturePayload = '';

        if (typeof data === 'string') {
            signaturePayload = data;
        } else if (data && typeof data === 'object') {
            if (data.wsb_seed && data.wsb_storeid && data.wsb_order_num && data.wsb_currency_id && data.wsb_total) {
                signaturePayload = `${data.wsb_seed}${data.wsb_storeid}${data.wsb_order_num}${data.wsb_test || ''}${data.wsb_currency_id}${data.wsb_total}${WEBPAY_SECRET_KEY}`;
            } else {
                signaturePayload = JSON.stringify(data) + WEBPAY_SECRET_KEY;
            }
        } else {
            logger.error('Invalid data format for WebPay signature validation');
            return false;
        }

        const algorithm = options.algorithm || HashAlgorithm.SHA1;
        const calculatedSignature = crypto.createHash(algorithm).update(signaturePayload).digest('hex');
        const isValid = calculatedSignature === signature;

        const logFn = options.logLevel === 'debug' ? logger.info : logger.info;
        logFn('WebPay signature validation', {
            isValid,
            algorithm,
            dataHash: crypto.createHash('md5').update(signaturePayload).digest('hex'),
            signatureLength: signature.length,
        });

        return isValid;
    } catch (error) {
        logger.error('Error validating WebPay signature', { error });
        return false;
    }
};
