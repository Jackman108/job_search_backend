/**
 * Контекст для реализации паттерна Стратегия платежей
 * Позволяет динамически переключаться между разными платежными системами
 */
import {
    PaymentResult,
    PaymentStatus,
    PaymentStrategy,
    PaymentStrategyContext,
    RefundPaymentParams
} from '@interface';
import { logger } from '@utils';

/**
 * Контекст стратегии платежей - объект, который выбирает и выполняет
 * конкретную стратегию оплаты в зависимости от выбранного метода
 * @returns Объект контекста стратегии платежей
 */
export const createPaymentStrategyContext = (): PaymentStrategyContext => {
    // Текущая активная стратегия платежа
    let currentStrategy: PaymentStrategy | null = null;

    /**
     * Установка текущей стратегии платежа
     * @param strategy Стратегия оплаты
     */
    const setStrategy = (strategy: PaymentStrategy): void => {
        logger.info('Setting payment strategy');
        currentStrategy = strategy;
    };

    /**
     * Выполнение платежа с использованием выбранной стратегии
     * @param params Параметры платежа
     * @returns Результат инициализации платежа
     */
    const executePayment = async (params: any): Promise<PaymentResult<any>> => {
        if (!currentStrategy) {
            logger.error('Payment strategy not set');
            return {
                success: false,
                error: 'Payment strategy not set'
            };
        }

        try {
            logger.info('Executing payment with strategy', { params });
            return await currentStrategy.initPayment(params);
        } catch (error) {
            logger.error('Error executing payment strategy', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    };

    /**
     * Валидация и обработка вебхука с использованием выбранной стратегии
     * @param data Данные вебхука
     * @param signature Подпись вебхука
     * @returns Результат обработки вебхука
     */
    const validateWebhook = async (data: any, signature: string): Promise<PaymentResult<boolean>> => {
        if (!currentStrategy) {
            logger.error('Payment strategy not set for webhook validation');
            return {
                success: false,
                error: 'Payment strategy not set'
            };
        }

        try {
            logger.info('Processing webhook with strategy', { data });
            return await currentStrategy.processPaymentWebhook(data, signature);
        } catch (error) {
            logger.error('Error processing webhook', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    };

    /**
     * Проверка статуса платежа с использованием выбранной стратегии
     * @param paymentId Идентификатор платежа
     * @returns Результат проверки статуса
     */
    const checkStatus = async (paymentId: string): Promise<PaymentResult<PaymentStatus>> => {
        if (!currentStrategy) {
            logger.error('Payment strategy not set for status check');
            return {
                success: false,
                error: 'Payment strategy not set'
            };
        }

        try {
            logger.info('Checking payment status with strategy', { paymentId });
            return await currentStrategy.checkPaymentStatus(paymentId);
        } catch (error) {
            logger.error('Error checking payment status', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    };

    /**
     * Возврат средств (рефанд) с использованием выбранной стратегии
     * @param params Параметры возврата средств
     * @returns Результат операции возврата
     */
    const refundPayment = async (params: RefundPaymentParams): Promise<PaymentResult<any>> => {
        if (!currentStrategy) {
            logger.error('Payment strategy not set for refund operation');
            return {
                success: false,
                error: 'Payment strategy not set'
            };
        }

        try {
            logger.info('Processing refund with strategy', { params });
            return await currentStrategy.refundPayment(params);
        } catch (error) {
            logger.error('Error processing refund', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                errorCode: 'REFUND_ERROR'
            };
        }
    };

    /**
     * Получение детальной информации о платеже
     * @param paymentId Идентификатор платежа
     * @returns Детальная информация о платеже
     */
    const getPaymentDetails = async (paymentId: string): Promise<PaymentResult<any>> => {
        if (!currentStrategy) {
            logger.error('Payment strategy not set for getting payment details');
            return {
                success: false,
                error: 'Payment strategy not set'
            };
        }

        try {
            logger.info('Getting payment details with strategy', { paymentId });
            return await currentStrategy.getPaymentDetails(paymentId);
        } catch (error) {
            logger.error('Error getting payment details', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                errorCode: 'DETAILS_ERROR'
            };
        }
    };

    // Возвращаем объект контекста, соответствующий интерфейсу
    return {
        strategy: currentStrategy!,
        setStrategy,
        executePayment,
        validateWebhook,
        checkStatus,
        refundPayment,
        getPaymentDetails
    };
}; 