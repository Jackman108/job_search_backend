import { USE_MOCK_PROVIDER } from '@config';
import {
    getCryptoPaymentById,
    isValidUuid,
    nowpaymentsApi,
    updatePaymentStatuses,
    withErrorHandling,
} from '@integrations';
import { CryptoPaymentDetails, PaymentResult, PaymentStatus } from '@interface';
import { executeQuery, logger } from '@utils';
import { mockCryptoResponse } from '../../../mock/mockCryptoResponse';

/**
 * Проверяет статус платежа у провайдера и обновляет записи
 */
export const checkCryptoPaymentStatus = async (paymentId: string): Promise<PaymentResult<PaymentStatus>> => {
    return await withErrorHandling(async () => {
        logger.info('Checking crypto payment status', { paymentId });

        if (!isValidUuid(paymentId)) {
            throw new Error('Invalid payment ID format. Expected UUID');
        }

        if (USE_MOCK_PROVIDER) {
            return await handleMockPaymentStatus(paymentId);
        }

        return await handleRealPaymentStatus(paymentId);
    });
};

const handleMockPaymentStatus = async (paymentId: string): Promise<PaymentStatus> => {
    logger.info('Using mock crypto payment status in development mode');

    const createdAtResults = await executeQuery('SELECT created_at FROM crypto_payments WHERE id = $1', [paymentId]);

    if (createdAtResults.length > 0) {
        const createdAt = new Date(createdAtResults[0].created_at);
        const now = new Date();
        const oneMinuteInMs = 60 * 1000;

        if (now.getTime() - createdAt.getTime() > oneMinuteInMs) {
            const status = mockCryptoResponse.payment_status;
            const mockTxHash = mockCryptoResponse.transaction_hash || 'mock-tx-hash';

            if (paymentId) {
                await updatePaymentStatuses(paymentId, status, mockTxHash);
            }

            return status;
        }
    }

    return PaymentStatus.Pending;
};

const handleRealPaymentStatus = async (paymentId: string): Promise<PaymentStatus> => {
    const cryptoPayment = await getCryptoPaymentById(paymentId);
    const externalPaymentId = cryptoPayment.transaction_hash;

    if (!externalPaymentId) {
        logger.error('Missing external payment ID for crypto payment', { paymentId });
        throw new Error('Missing external payment ID');
    }

    const paymentStatus = await nowpaymentsApi.getPaymentStatus(externalPaymentId);
    const status = nowpaymentsApi.mapPaymentStatus(paymentStatus.payment_status);

    if (paymentId) {
        await updatePaymentStatuses(paymentId, status);
    }

    return status;
};

/**
 * Проверка статуса криптоплатежа
 */
export const checkUserCryptoPaymentStatus = async (_userId: string, paymentId: string): Promise<PaymentStatus> => {
    if (USE_MOCK_PROVIDER) {
        return await checkMockCryptoStatus(paymentId);
    }

    return await checkRealCryptoStatus(paymentId);
};

const checkMockCryptoStatus = async (paymentId: string): Promise<PaymentStatus> => {
    logger.info('Using mock crypto payment status in development mode');

    const cryptoPayments = await executeQuery<CryptoPaymentDetails>(`SELECT * FROM crypto_payments WHERE id = $1`, [
        paymentId,
    ]);

    if (cryptoPayments.length > 0) {
        const cryptoPayment = cryptoPayments[0];
        const createdAt = new Date(cryptoPayment.created_at || new Date());
        const now = new Date();
        const oneMinuteInMs = 60 * 1000;

        if (now.getTime() - createdAt.getTime() > oneMinuteInMs) {
            const status = PaymentStatus.Completed;
            const mockTxHash = mockCryptoResponse.transaction_hash || 'mock-tx-hash';

            if (paymentId) {
                await updatePaymentStatuses(paymentId, status, mockTxHash);
            }

            return status;
        }
    }

    return PaymentStatus.Pending;
};

const checkRealCryptoStatus = async (paymentId: string): Promise<PaymentStatus> => {
    const statusResults = await executeQuery<{ payment_status: PaymentStatus }>(
        `SELECT payment_status FROM crypto_payments WHERE id = $1`,
        [paymentId],
    );

    if (statusResults.length === 0) {
        throw new Error(`Crypto payment not found for id ${paymentId}`);
    }

    const currentStatus = statusResults[0].payment_status;

    if (currentStatus === PaymentStatus.Pending) {
        try {
            const result = await checkCryptoPaymentStatus(paymentId);

            if (result.success && result.data && result.data !== currentStatus) {
                if (paymentId) {
                    await updatePaymentStatuses(paymentId, result.data);
                }

                return result.data;
            }
        } catch (error) {
            logger.error('Error checking crypto payment status:', { error });
        }
    }

    return currentStatus;
};
