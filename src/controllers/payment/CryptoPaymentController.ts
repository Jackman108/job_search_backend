import { checkCryptoPaymentStatus, createCryptoPayment, getActiveSubscription, processWebhook } from '@services';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';


export class CryptoPaymentController {
    static async createPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const activeSubscription = await getActiveSubscription(req.userId!);

            if (!activeSubscription || activeSubscription.length === 0) {
                return res.status(400).json({ error: 'No active subscription found' });
            }

            const subscription = activeSubscription[0];
            const cryptoPayment = await createCryptoPayment(
                subscription.id,
                subscription.price,
                'USD'
            );

            handleSuccess(res, 'Crypto payment created successfully', cryptoPayment);
        } catch (error) {
            handleErrors(res, error, 'Failed to create crypto payment');
        }
    }

    static async checkPaymentStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const { paymentId } = req.params;
            const status = await checkCryptoPaymentStatus(paymentId);
            handleSuccess(res, 'Payment status retrieved', { status });
        } catch (error) {
            handleErrors(res, error, 'Failed to check payment status');
        }
    }

    static async handleWebhook(req: Request, res: Response): Promise<void> {
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