import { checkCryptoPaymentStatus, createCryptoPayment, getActiveSubscription, processWebhook, listCryptoPayments, deleteCryptoPayment, getCryptoPayment, updateCryptoPayment, createMockCryptoPayment } from '@services';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';
import { USE_MOCK_PROVIDER } from '../../config/payment.config';
import { executeQuery } from '@utils';

/**
 * Проверяет и удаляет существующий WebPay платеж при переключении на криптоплатеж
 * @param subscriptionId ID подписки
 */
const deletePendingWebPayPayment = async (subscriptionId: string): Promise<void> => {
    // Получаем ID платежа по подписке
    const paymentQuery = `
        SELECT p.id 
        FROM payments p 
        WHERE p.subscription_id = $1 AND p.payment_status = 'pending'
        LIMIT 1
    `;
    const paymentResult = await executeQuery(paymentQuery, [subscriptionId]);

    if (paymentResult.length > 0) {
        const paymentId = paymentResult[0].id;

        // Удаляем платеж WebPay по связанному payment_id
        const deleteQuery = `
            DELETE FROM webpay_payments 
            WHERE payment_id = $1
        `;
        await executeQuery(deleteQuery, [paymentId]);
        console.log(`Deleted pending WebPay payment for subscription: ${subscriptionId}`);
    }
};

export class CryptoPaymentController {
    async createCryptoPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const { id, subscription_id, amount, currency, network } = req.body;

            if (!id || !subscription_id || !amount) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Удаляем существующие платежи WebPay при переключении на криптоплатеж
            await deletePendingWebPayPayment(subscription_id);

            let cryptoPayment;

            // В режиме разработки используем моковые данные
            if (USE_MOCK_PROVIDER) {
                console.log('Using mock crypto payment in development mode');
                cryptoPayment = await createMockCryptoPayment({
                    id,
                    subscription_id,
                    amount,
                    currency: currency || 'BTC'
                });
            } else {
                // В продакшн режиме используем реальные данные
                cryptoPayment = await createCryptoPayment({
                    id,
                    subscription_id,
                    amount,
                    currency: currency || 'BTC',
                    network: network || 'BTC'
                });
            }

            handleSuccess(res, 'Crypto payment created successfully', cryptoPayment);
        } catch (error) {
            handleErrors(res, error, 'Failed to create crypto payment');
        }
    }

    async checkCryptoPaymentStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const paymentId = req.params.paymentId || (req.body && req.body.paymentId);
            if (!paymentId) {
                throw new Error('Payment ID is required');
            }
            const statusData = await checkCryptoPaymentStatus(paymentId);
            handleSuccess(res, 'Payment status retrieved', { status: statusData });
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

    async listCryptoPayments(req: AuthenticatedRequest, res: Response) {
        try {
            const payments = await listCryptoPayments(req.userId!);
            res.status(200).json(payments);
        } catch (error) {
            handleErrors(res, error, 'Error listing crypto payments');
        }
    }

    async getCryptoPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const payment = await getCryptoPayment(req.userId!, req.params.paymentId);
            handleSuccess(res, 'Crypto payment retrieved successfully', payment);
        } catch (error) {
            handleErrors(res, error, 'Failed to fetch crypto payment');
        }
    }

    async updateCryptoPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const updated = await updateCryptoPayment(req.params.paymentId, req.body);
            handleSuccess(res, 'Crypto payment updated successfully', updated);
        } catch (error) {
            handleErrors(res, error, 'Failed to update crypto payment');
        }
    }

    async deleteCryptoPayment(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteCryptoPayment(req.userId!, req.params.paymentId);
            handleSuccess(res, 'Crypto payment deleted successfully');
        } catch (error) {
            handleErrors(res, error, 'Failed to delete crypto payment');
        }
    }
} 