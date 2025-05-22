import { Response } from 'express';
import { handleErrors, handleSuccess } from '@middlewares';
import {
    createPayment,
    deletePayment,
    getPayment,
    listPayments,
    updatePayment,
    initWebpayPayment,
    initFiatPayment,
} from '@services';
import { AuthenticatedRequest, PaymentBase } from '@interface';

export class PaymentController {
    async listPayments(req: AuthenticatedRequest, res: Response) {
        try {
            const payments = await listPayments(req.userId!);
            res.status(200).json(payments);
        } catch (error) {
            handleErrors(res, error, 'Error fetching payments.');
        }
    }

    async getPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const payment = await getPayment(req.userId!, req.params.id);
            res.status(200).json(payment);
        } catch (error) {
            handleErrors(res, error, 'Error fetching payment.');
        }
    }

    async createPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const { amount, currency, payment_method } = req.body;
            const result = await initFiatPayment({
                userId: req.userId!,
                amount,
                currency,
                payment_method,
            });
            handleSuccess(res, 'Fiat payment initialized', result);
        } catch (error) {
            handleErrors(res, error, 'Error initializing fiat payment.');
        }
    }

    async updatePayment(req: AuthenticatedRequest, res: Response) {
        try {
            const updated = await updatePayment(req.userId!, req.params.id, req.body);
            handleSuccess(res, 'Payment updated successfully', updated);
        } catch (error) {
            handleErrors(res, error, 'Error updating payment.');
        }
    }

    async deletePayment(req: AuthenticatedRequest, res: Response) {
        try {
            await deletePayment(req.userId!, req.params.id);
            handleSuccess(res, 'Payment successfully deleted.');
        } catch (error) {
            handleErrors(res, error, 'Error deleting payment.');
        }
    }

    /**
     * Инициализирует платеж через WebPay и возвращает URL для редиректа
     */
    async initWebpay(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await initWebpayPayment(req.body);
            handleSuccess(res, 'WebPay initialized', result);
        } catch (error) {
            handleErrors(res, error, 'Error initializing WebPay payment.');
        }
    }
}
