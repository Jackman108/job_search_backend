import { USE_MOCK_PROVIDER } from '@config';
import { nowpaymentsApi, updatePaymentStatuses, validateNowPaymentsSignature, withErrorHandling } from '@integrations';
import { CryptoPaymentDetails, PaymentResult, PaymentStatus } from '@interface';
import { executeQuery, logger } from '@utils';
import {
    buildProviderEventId,
    claimWebhookEvent,
    decideWebhookGate,
    resolveCryptoEventKey,
} from '../../webhookPublic.js';

/**
 * Processes crypto provider webhook: verify signature → claim event → side effects.
 */
export const processWebhook = async (
    webhookData: any,
    signature: string,
    rawBody?: string,
): Promise<PaymentResult<boolean>> => {
    return await withErrorHandling(async () => {
        logger.info('Processing crypto webhook', { hasRawBody: Boolean(rawBody) });

        const signatureOk =
            USE_MOCK_PROVIDER ||
            validateNowPaymentsSignature(
                rawBody && looksLikeJsonObject(rawBody) ? safeJsonParse(rawBody) : webhookData,
                signature,
            );

        const eventKey = resolveCryptoEventKey((webhookData || {}) as Record<string, unknown>);
        let claim: 'claimed' | 'duplicate' | null = null;
        if (signatureOk && eventKey) {
            claim = await claimWebhookEvent('crypto', buildProviderEventId('crypto', eventKey));
        }

        const decision = decideWebhookGate({ signatureOk, eventKey, claim });
        if (decision === 'reject_signature') {
            logger.error('Invalid crypto webhook signature');
            throw new Error('Invalid webhook signature');
        }
        if (decision === 'reject_event') {
            throw new Error('Missing payment_id in webhook data');
        }
        if (decision === 'skip_duplicate') {
            logger.info('Skipping duplicate crypto webhook', { eventKey });
            return true;
        }

        const { payment_id: nowPaymentsId, payment_status } = webhookData;
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

        if (!cryptoPayment.id) {
            logger.error('Missing crypto payment ID', { nowPaymentsId });
            throw new Error('Missing crypto payment ID');
        }

        await updatePaymentStatuses(cryptoPayment.id, normalizedStatus);
        await logWebhook({
            paymentId: cryptoPayment.payment_id,
            status: normalizedStatus,
            data: webhookData,
        });

        return true;
    });
};

const looksLikeJsonObject = (raw: string) => raw.trim().startsWith('{');

const safeJsonParse = (raw: string): unknown => {
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

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
