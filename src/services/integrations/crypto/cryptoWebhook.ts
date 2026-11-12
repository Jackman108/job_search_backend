import { USE_MOCK_PROVIDER } from '@config';
import { nowpaymentsApi, updatePaymentStatuses, validateNowPaymentsSignature, withErrorHandling } from '@integrations';
import { CryptoPaymentDetails, PaymentResult, PaymentStatus } from '@interface';
import { executeQuery, logger } from '@utils';

/**
 * Обрабатывает вебхук от провайдера
 */
export const processWebhook = async (webhookData: any, signature: string): Promise<PaymentResult<boolean>> => {
    return await withErrorHandling(async () => {
        logger.info('Processing crypto webhook', { webhookData });

        if (!USE_MOCK_PROVIDER && !validateNowPaymentsSignature(webhookData, signature)) {
            logger.error('Invalid crypto webhook signature', { signature });
            throw new Error('Invalid webhook signature');
        }

        const { payment_id: nowPaymentsId, payment_status } = webhookData;

        if (!nowPaymentsId) {
            logger.error('Missing payment_id in webhook data', { webhookData });
            throw new Error('Missing payment_id in webhook data');
        }

        const cryptoPayments = await executeQuery<CryptoPaymentDetails>(
            'SELECT * FROM crypto_payments WHERE transaction_hash = $1',
            [nowPaymentsId],
        );

        if (cryptoPayments.length === 0) {
            logger.error('Crypto payment not found for external ID', { nowPaymentsId });
            throw new Error(`Crypto payment not found for external ID ${nowPaymentsId}`);
        }

        const cryptoPayment = cryptoPayments[0];
        const normalizedStatus = USE_MOCK_PROVIDER ? payment_status : nowpaymentsApi.mapPaymentStatus(payment_status);

        if (cryptoPayment.id) {
            await updatePaymentStatuses(cryptoPayment.id, normalizedStatus);
        } else {
            logger.error('Missing crypto payment ID', { nowPaymentsId });
            throw new Error('Missing crypto payment ID');
        }

        await logWebhook({
            paymentId: cryptoPayment.payment_id,
            status: normalizedStatus,
            data: webhookData,
        });

        return true;
    });
};

/**
 * Логирует данные вебхука в БД
 */
const logWebhook = async (data: { paymentId: string; status: PaymentStatus; data: any }): Promise<void> => {
    try {
        await executeQuery(
            `INSERT INTO webhook_logs 
             (payment_id, payment_status, data, created_at) 
             VALUES ($1, $2, $3, $4)`,
            [data.paymentId, data.status, JSON.stringify(data.data), new Date()],
        );
    } catch (error) {
        logger.error('Error logging webhook data', { error, data });
    }
};
