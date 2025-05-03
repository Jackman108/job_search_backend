import { Response } from 'express';
import { handleErrors, handleSuccess } from '../middlewares/index.js';
import {
    createPayment,
    deletePayment,
    getPayment,
    listPayments,
    updatePayment,
    updatePaymentStatus
} from '../services/paymentService.js';
import { AuthenticatedRequest } from "../interface/index.js";

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
            await createPayment(req.userId!, {
                subscription_id: req.body.subscription_id,
                amount: req.body.amount,
                payment_status: req.body.payment_status,
                payment_method: req.body.payment_method,
            });
            handleSuccess(res, 'Payment successfully creating.');
        } catch (error) {
            handleErrors(res, error, 'Error creating payment.');
        }
    }

    async updatePayment(req: AuthenticatedRequest, res: Response) {
        try {
            await updatePayment(req.userId!, req.params.id, req.body);
            handleSuccess(res, 'Payment successfully updating.');
        } catch (error) {
            handleErrors(res, error, 'Error updating payment.');
        }
    }

    async updatePaymentStatus(req: AuthenticatedRequest, res: Response) {
        try {
            await updatePaymentStatus(req.userId!, req.params.id, req.body.status);
            handleSuccess(res, 'Payment status successfully updating.');
        } catch (error) {
            handleErrors(res, error, 'Error updating payment status');
        }
    };

    async deletePayment(req: AuthenticatedRequest, res: Response) {
        try {
            await deletePayment(req.userId!, req.params.id);
            handleSuccess(res, 'Payment successfully deleted.');
        } catch (error) {
            handleErrors(res, error, 'Error deleting payment.');
        }
    }
}
