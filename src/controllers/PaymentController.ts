import {Response} from 'express';
import {AuthenticatedRequest, handleErrors} from '../server/middlewares.js';
import {
    createPayment,
    createTablePayments,
    deletePayment,
    getPayment,
    listPayments,
    updatePayment,
    updatePaymentStatus
} from '../services/paymentService.js';

export class PaymentController {

    async createPaymentTable(req: AuthenticatedRequest, res: Response) {
        try {
            await createTablePayments();
            res.status(201).json({message: 'Payments table created successfully.'});
        } catch (error) {
            handleErrors(res, error, 'Error creating payments table.');
        }
    }

    async listPayments(req: AuthenticatedRequest, res: Response) {
        const {status} = req.query;

        try {
            const payments = await listPayments(status as string);
            res.status(200).json(payments);
        } catch (error) {
            handleErrors(res, error, 'Error fetching payments.');
        }
    }

    async getPayment(req: AuthenticatedRequest, res: Response) {
        try {
            const payment = await getPayment(req.params.id);
            res.status(200).json(payment);
        } catch (error) {
            handleErrors(res, error, 'Error fetching payment.');
        }
    }

    async createPayment(req: AuthenticatedRequest, res: Response) {
        const {amount, paymentMethod}: { amount: number, paymentMethod: string } = req.body;

        try {
            const payment = await createPayment({
                userId: req.userId,
                amount,
                paymentStatus: 'pending',
                paymentMethod
            });
            res.status(201).json(payment);
        } catch (error) {
            handleErrors(res, error, 'Error creating payment.');
        }
    }

    async updatePayment(req: AuthenticatedRequest, res: Response) {
        try {
            const updatedPayment = await updatePayment(req.body.id, req.body);
            res.status(200).json(updatedPayment);
        } catch (error) {
            handleErrors(res, error, 'Error updating payment.');
        }
    }

    async updatePaymentStatus(req: AuthenticatedRequest, res: Response) {
        const {paymentId, status} = req.body;

        try {
            const updatedPayment = await updatePaymentStatus(paymentId, status);
            res.status(200).json(updatedPayment);
        } catch (error) {
            handleErrors(res, error, 'Error updating payment status');
        }
    };

    async deletePayment(req: AuthenticatedRequest, res: Response) {
        try {
            await deletePayment(req.params.id);
            res.status(200).json({message: 'Payment successfully deleted.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting payment.');
        }
    }
}
