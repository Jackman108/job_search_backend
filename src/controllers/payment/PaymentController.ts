import { Response } from 'express';
import { handleErrors, handleSuccess } from '@middlewares';
import {
    createPayment,
    deletePayment,
    getPayment,
    listPayments,
    updatePayment,
} from '@services';
import { AuthenticatedRequest, Payment } from '@interface';

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
            const created = await createPayment(req.userId!, {
                amount: req.body.amount,
                payment_status: req.body.payment_status,
                payment_method: req.body.payment_method,
            });
            handleSuccess(res, 'Payment created successfully', created);
        } catch (error) {
            handleErrors(res, error, 'Error creating payment.');
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
}
