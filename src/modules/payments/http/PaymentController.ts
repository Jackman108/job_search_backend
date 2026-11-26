import { AuthenticatedRequest } from '../../../interface/index.js';
import { handleErrors, handleSuccess } from '@middlewares';
import { Response } from 'express';
import { safePaymentOperations } from '../application/paymentService.js';

/** HTTP adapter for core payments CRUD. */
export class PaymentController {
    async listPayments(req: AuthenticatedRequest, res: Response) {
        const result = await safePaymentOperations.listPayments(req.userId!);

        if (result.success) {
            res.status(200).json(result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Error fetching payments');
        }
    }

    async getPayment(req: AuthenticatedRequest, res: Response) {
        // Reserved static segments under /payment/* (crypto/webpay) — not payment UUID ids.
        if (req.params.id === 'crypto' || req.params.id === 'webpay') {
            res.status(404).json({ success: false, message: 'Not found' });
            return;
        }
        const result = await safePaymentOperations.getPayment(req.userId!, req.params.id);

        if (result.success) {
            handleSuccess(res, 'Payments retrieved successfully', result.data);
        } else {
            const notFound = /not found/i.test(result.error || '');
            if (notFound) {
                res.status(404).json({ success: false, message: result.error || 'Payment not found' });
                return;
            }
            handleErrors(res, new Error(result.error), 'Failed to retrieve payments');
        }
    }

    async createPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const { amount, subscription_id, currency, payment_method } = req.body;

            const result = await safePaymentOperations.createPayment({
                userId: req.userId,
                subscription_id,
                amount,
                currency,
                payment_method,
            });

            if (result.success) {
                handleSuccess(res, 'Payment created successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error || 'Unknown error'), 'Error creating payment');
            }
        } catch (error) {
            handleErrors(res, error, 'Error creating payment');
        }
    }

    async updatePayment(req: AuthenticatedRequest, res: Response) {
        const result = await safePaymentOperations.updatePayment(req.userId!, req.params.id, req.body);

        if (result.success) {
            handleSuccess(res, 'Payment updated successfully', result.data);
        } else {
            handleErrors(res, new Error(result.error), 'Error updating payment');
        }
    }

    async deletePayment(req: AuthenticatedRequest, res: Response) {
        const result = await safePaymentOperations.deletePayment(req.userId!, req.params.id);

        if (result.success) {
            handleSuccess(res, 'Payment deleted successfully');
        } else {
            handleErrors(res, new Error(result.error), 'Error deleting payment');
        }
    }
}
