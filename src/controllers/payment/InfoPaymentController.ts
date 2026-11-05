import { AuthenticatedRequest } from '@interface';
import { handleErrors, handleSuccess } from '@middlewares';
import { infoPaymentOperations } from '@services';
import { Response } from 'express';

/**
 * Контроллер для информационных методов о платежах
 */
export class InfoPaymentController {
    /**
     * Получение информации о доступных платежных методах
     */
    async getPaymentMethods(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await infoPaymentOperations.getPaymentMethods();

            if (result.success) {
                handleSuccess(res, 'Payment methods retrieved successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Error retrieving payment methods');
            }
        } catch (error) {
            handleErrors(res, error, 'Error retrieving payment methods');
        }
    }

    /**
     * Получение информации о текущем тарифе пользователя
     */
    async getCurrentPlan(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await infoPaymentOperations.getCurrentPlan(req.userId!);

            if (result.success) {
                handleSuccess(res, 'Current plan retrieved successfully', result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Error retrieving current plan');
            }
        } catch (error) {
            handleErrors(res, error, 'Error retrieving current plan');
        }
    }

    /**
     * Тестовая страница для демонстрации работы платежных систем
     */
    async getTestPaymentPage(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await infoPaymentOperations.getTestPaymentPageHtml();

            if (result.success) {
                res.setHeader('Content-Type', 'text/html');
                res.send(result.data);
            } else {
                handleErrors(res, new Error(result.error), 'Error loading test payment page');
            }
        } catch (error) {
            handleErrors(res, error, 'Error loading test payment page');
        }
    }
} 