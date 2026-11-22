import {
    checkPaymentStatus,
    getPaymentDetails,
    initializeCryptoPayment,
    initializeWebpayPayment,
    processPaymentWebhook,
    refundPayment,
    validatePaymentMethod,
    validatePaymentParams,
} from '@integrations';
import { AuthenticatedRequest, RefundPaymentParams } from '@interface';
import { handleControllerError, handleErrors, handleSuccess } from '@middlewares';
import { logger } from '@utils';
import { Request, Response } from 'express';

type RequestWithRawBody = Request & { rawBody?: string };

/** HTTP adapter for payment provider integration + webhooks (S6). */
export class PaymentIntegrationController {
    async initializePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { paymentMethod } = req.params;
            const paymentData = req.body;

            logger.info('Initializing payment with integration controller', { paymentMethod });

            if (!validatePaymentMethod(res, paymentMethod)) return;

            const validationResult = validatePaymentParams(paymentData, ['amount']);
            if (!validationResult.success) {
                handleErrors(res, new Error(validationResult.error), 'Initializing payment with validation error');
                return;
            }

            const baseParams = {
                paymentId: paymentData.payment_id,
                amount: paymentData.amount,
                userId: req.userId!,
            };

            const result = await (paymentMethod.toLowerCase() === 'webpay'
                ? initializeWebpayPayment({
                      ...baseParams,
                      currency: paymentData.currency || 'BYN',
                  })
                : paymentMethod.toLowerCase() === 'crypto'
                  ? initializeCryptoPayment({
                        ...baseParams,
                        currency: paymentData.currency || 'BTC',
                        network: paymentData.network || 'BTC',
                    })
                  : {
                        success: false,
                        error: `Unsupported payment method: ${paymentMethod}`,
                    });

            if (result.success && 'data' in result) {
                handleSuccess(res, 'Payment initialized successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Payment initialization failed');
            }
        } catch (error) {
            handleControllerError(res, error, 'Error in payment initialization');
        }
    }

    async handlePaymentWebhook(req: RequestWithRawBody, res: Response): Promise<void> {
        try {
            const { paymentMethod } = req.params;
            const webhookData = req.body;
            const signature = (req.headers['x-webhook-signature'] as string) || '';
            const rawBody = req.rawBody;

            logger.info('Processing payment webhook', {
                paymentMethod,
                hasRawBody: Boolean(rawBody),
            });

            if (!validatePaymentMethod(res, paymentMethod)) return;

            if (!webhookData) {
                handleErrors(res, new Error('Empty webhook data'), 'Empty webhook data');
                return;
            }

            const result = await processPaymentWebhook(paymentMethod, webhookData, signature, rawBody);

            if (result.success) {
                handleSuccess(res, 'Webhook processed successfully');
            } else {
                handleErrors(res, new Error(result.error), 'Webhook processing failed');
            }
        } catch (error) {
            handleControllerError(res, error, 'Error processing payment webhook');
        }
    }

    async checkPaymentStatusController(req: Request, res: Response): Promise<void> {
        try {
            const { paymentMethod, paymentId } = req.params;
            if (!validatePaymentMethod(res, paymentMethod)) return;
            if (!paymentId) {
                handleErrors(res, new Error('Payment ID is required'), 'Payment ID is required');
                return;
            }

            const result = await checkPaymentStatus(paymentMethod, paymentId);
            if (result.success) {
                handleSuccess(res, 'Payment status retrieved successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Status check failed');
            }
        } catch (error) {
            handleControllerError(res, error, 'Error checking payment status');
        }
    }

    async handlePaymentRefund(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { paymentMethod } = req.params;
            const refundData = req.body as RefundPaymentParams;
            if (!validatePaymentMethod(res, paymentMethod)) return;

            const validationResult = validatePaymentParams(refundData, ['paymentId']);
            if (!validationResult.success) {
                handleErrors(res, new Error(validationResult.error), 'Validation error');
                return;
            }

            const result = await refundPayment(paymentMethod, refundData);
            if (result.success) {
                handleSuccess(res, 'Payment refunded successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Refund processing failed');
            }
        } catch (error) {
            handleControllerError(res, error, 'Error processing payment refund');
        }
    }

    async getPaymentDetailsController(req: Request, res: Response): Promise<void> {
        try {
            const { paymentMethod, paymentId } = req.params;
            if (!validatePaymentMethod(res, paymentMethod)) return;
            if (!paymentId) {
                handleErrors(res, new Error('Payment ID is required'), 'Payment ID is required');
                return;
            }

            const result = await getPaymentDetails(paymentMethod, paymentId);
            if (result.success) {
                handleSuccess(res, 'Payment details retrieved successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Failed to get payment details');
            }
        } catch (error) {
            handleControllerError(res, error, 'Error getting payment details');
        }
    }
}
