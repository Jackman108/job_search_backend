import { USE_MOCK_PROVIDER } from '@config';
import { cleanupPendingWebPayPayment, nowpaymentsApi, withErrorHandling } from '@integrations';
import {
    CryptoPaymentData,
    CryptoPaymentDetails,
    InitCryptoPaymentParams,
    PaymentResult,
    PaymentStatus,
} from '@interface';
import { createCryptoPayment } from '@services';
import { logger } from '@utils';
import { mockCryptoResponse } from '../../../mock/mockCryptoResponse';
import { processWebhook } from './cryptoWebhook.js';

/**
 * Инициализация криптоплатежа
 */
export const initCryptoDirectPayment = async (
    params: InitCryptoPaymentParams,
): Promise<PaymentResult<CryptoPaymentDetails>> => {
    return withErrorHandling(async () => {
        const { paymentId, amount, currency, network, userId } = params;

        await cleanupPendingWebPayPayment(paymentId);

        const cryptoData: CryptoPaymentData = {
            payment_id: paymentId,
            amount,
            currency: currency || 'BTC',
            network: network || 'BTC',
            wallet_provider: 'NOWCRYPTO',
        };

        if (USE_MOCK_PROVIDER) {
            return await createMockCryptoPayment(cryptoData);
        }

        return await createRealCryptoPayment(cryptoData, userId);
    });
};

const createMockCryptoPayment = async (cryptoData: CryptoPaymentData): Promise<CryptoPaymentDetails> => {
    cryptoData.crypto_address = mockCryptoResponse.crypto_address;

    const payment = await createCryptoPayment(cryptoData);

    setTimeout(async () => {
        try {
            await processWebhook(
                {
                    payment_id: payment.id,
                    payment_status: PaymentStatus.Completed,
                    txid: 'mock-tx-' + Date.now(),
                },
                'mock-signature',
            );
            logger.info(`Mock crypto payment ${payment.id} completed successfully`);
        } catch (error) {
            logger.error('Error processing mock webhook:', { error });
        }
    }, 60000);

    return payment;
};

const createRealCryptoPayment = async (
    cryptoData: CryptoPaymentData,
    userId: string,
): Promise<CryptoPaymentDetails> => {
    try {
        const apiResponse = await nowpaymentsApi.createPayment({
            price_amount: cryptoData.amount,
            price_currency: 'USD',
            pay_currency: cryptoData.currency || 'BTC',
            ipn_callback_url: `${process.env.API_URL}/api/payments/webhook/crypto`,
            order_id: cryptoData.payment_id,
            order_description: `Payment for user ${userId}`,
            is_fixed_rate: true,
        });

        const transactionHash = apiResponse.payment_id ? String(apiResponse.payment_id) : null;

        return await createCryptoPayment({
            payment_id: cryptoData.payment_id,
            amount: cryptoData.amount,
            currency: cryptoData.currency || 'BTC',
            network: cryptoData.network || apiResponse.network || 'BTC',
            crypto_address: apiResponse.pay_address,
            crypto_amount: apiResponse.pay_amount,
            transaction_hash: transactionHash,
            payment_status: nowpaymentsApi.mapPaymentStatus(apiResponse.payment_status),
            wallet_provider: 'NOWCRYPTO',
            expires_at: apiResponse.valid_until ? new Date(apiResponse.valid_until) : undefined,
        });
    } catch (error) {
        logger.error('Error creating crypto payment', { error, cryptoData });
        throw error;
    }
};
