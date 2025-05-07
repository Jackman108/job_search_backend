import { checkCryptoPaymentStatus, createCryptoPayment, getActiveSubscription, processWebhook, getExistingPendingPayment } from '@services';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';

export class CryptoPaymentController {
    async createCryptoPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const { id, subscription_id, amount, currency, network } = req.body;

            if (!id || !subscription_id || !amount) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const existingPayment = await getExistingPendingPayment(id);
            if (existingPayment) {
                return handleSuccess(res, 'Existing pending payment found', existingPayment);
            }

            const cryptoPayment = await createCryptoPayment({
                id,
                subscription_id,
                amount,
                currency: currency || 'BTC',
                network: network || 'BTC'
            });

            handleSuccess(res, 'Crypto payment created successfully', cryptoPayment);
        } catch (error) {
            handleErrors(res, error, 'Failed to create crypto payment');
        }
    }

    async checkCryptoPaymentStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const paymentId = req.params.paymentId;
            if (!paymentId || paymentId === ':paymentId') {
                throw new Error('Payment ID is required');
            }
            const status = await checkCryptoPaymentStatus(paymentId);
            handleSuccess(res, 'Payment status retrieved', { status });
        } catch (error) {
            handleErrors(res, error, 'Failed to check payment status');
        }
    }

    async handleWebhook(req: Request, res: Response): Promise<void> {
        try {
            const signature = req.headers['x-nowpayments-sig'] as string;
            if (!signature) {
                throw new Error('Missing signature');
            }

            await processWebhook(req.body, signature);
            handleSuccess(res, 'Webhook processed successfully');
        } catch (error) {
            handleErrors(res, error, 'Failed to process webhook');
        }
    }
} 