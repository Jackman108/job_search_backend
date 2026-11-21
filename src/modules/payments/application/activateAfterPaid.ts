import { PaymentStatus } from '@interface';
import { executeQuery, logger } from '@utils';
import { activateSubscription, subscriptionTypeFromAmount } from '../../subscriptions/index.js';
import { isPaymentsKeyedByUserId } from '../providers/common/paymentSchema.utils.js';

type PaymentRow = {
    id: string;
    amount: number | string;
    user_id?: string | null;
    subscription_id?: string | null;
    payment_status?: string;
};

/**
 * After a successful charge: map amount → plan and call subscriptions.activate().
 * Failures are logged; they must not roll back webhook idempotency / payment status.
 */
export async function activateAfterPaid(paymentId: string): Promise<void> {
    try {
        const rows = await executeQuery<PaymentRow>(`SELECT * FROM payments WHERE id = $1 LIMIT 1`, [paymentId]);
        const payment = rows[0];
        if (!payment) {
            logger.warn('activateAfterPaid: payment not found', { paymentId });
            return;
        }

        let userId = payment.user_id ?? null;
        if (!userId && payment.subscription_id) {
            const sub = await executeQuery<{ user_id: string }>(
                `SELECT user_id FROM subscriptions WHERE id = $1 LIMIT 1`,
                [payment.subscription_id],
            );
            userId = sub[0]?.user_id ?? null;
        }

        if (!userId && (await isPaymentsKeyedByUserId()) === false) {
            logger.warn('activateAfterPaid: cannot resolve user_id', { paymentId });
            return;
        }
        if (!userId) {
            logger.warn('activateAfterPaid: missing user_id', { paymentId });
            return;
        }

        const plan = subscriptionTypeFromAmount(Number(payment.amount));
        if (!plan) {
            logger.warn('activateAfterPaid: amount is not a known plan price', {
                paymentId,
                amount: payment.amount,
            });
            return;
        }

        await activateSubscription({
            user_id: userId,
            subscription_type: plan,
        });
        logger.info('activateAfterPaid: subscription activated', { paymentId, userId, plan });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Already-active is expected on replay / re-pay — do not fail the webhook path.
        if (/already has an active subscription/i.test(message)) {
            logger.info('activateAfterPaid: subscription already active', { paymentId });
            return;
        }
        logger.error('activateAfterPaid failed', { paymentId, error: message });
    }
}

export async function maybeActivateAfterStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    if (status !== PaymentStatus.Completed) return;
    await activateAfterPaid(paymentId);
}
