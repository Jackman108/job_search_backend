/**
 * Модуль для работы с API NOWPayments
 * Реализует функции для взаимодействия с платежной системой криптовалют
 */
import { nowPaymentsConfig } from '@config';
import {
    CreateNowInvoiceParams,
    CreateNowPaymentParams,
    INowPaymentsApi,
    NowPaymentsCreateInvoiceResponse,
    NowPaymentsCreatePaymentResponse,
    NowPaymentsPaymentStatusResponse,
    PaymentStatus
} from '@interface';
import { logger } from '@utils';
import axios from 'axios';
import { mapNowPaymentsStatus, validateNowPaymentsSignature } from '@integrations';

/**
 * Создает API клиент для работы с NOWPayments
 * @returns Объект с функциями для работы с API NOWPayments
 */
const createNowPaymentsApi = (): INowPaymentsApi => {
    const apiKey = nowPaymentsConfig.apiKey;
    const ipnSecret = nowPaymentsConfig.ipnSecret;

    if (!apiKey) {
        logger.error('NOWPayments API key is not configured');
    }

    // Создаем HTTP клиент с базовыми настройками
    const api = axios.create({
        baseURL: nowPaymentsConfig.baseUrl,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        timeout: 10000
    });

    // Добавляем перехватчики для логирования
    api.interceptors.request.use(
        (config) => {
            logger.info('NOWPayments API request', {
                method: config.method,
                url: config.url,
                data: config.data
            });
            return config;
        },
        (error) => {
            logger.error('NOWPayments API request error', { error });
            return Promise.reject(error);
        }
    );

    api.interceptors.response.use(
        (response) => {
            logger.info('NOWPayments API response', {
                status: response.status,
                data: response.data
            });
            return response;
        },
        (error) => {
            logger.error('NOWPayments API response error', {
                error: error.message,
                response: error.response?.data
            });
            return Promise.reject(error);
        }
    );

    /**
     * Обрабатывает ошибки API NOWPayments
     * @param error Объект ошибки
     * @returns Обработанная ошибка
     */
    const handleApiError = (error: any): Error => {
        if (error.response) {
            // Ошибка с ответом от сервера
            const { status, data } = error.response;
            const message = data?.message || 'Unknown NOWPayments API error';
            return new Error(`NOWPayments API error (${status}): ${message}`);
        } else if (error.request) {
            // Запрос был сделан, но ответ не получен
            return new Error(`NOWPayments API no response: ${error.message}`);
        } else {
            // Ошибка при настройке запроса
            return new Error(`NOWPayments API request error: ${error.message}`);
        }
    };

    /**
     * Создает платеж через API NOWPayments
     * @param params Параметры платежа
     * @returns Данные созданного платежа
     */
    const createPayment = async (params: CreateNowPaymentParams): Promise<NowPaymentsCreatePaymentResponse> => {
        try {
            const response = await api.post<NowPaymentsCreatePaymentResponse>('/payment', params);
            return response.data;
        } catch (error) {
            logger.error('Error creating NOWPayments payment', { error, params });
            throw handleApiError(error);
        }
    };

    /**
     * Создает счет через API NOWPayments
     * @param params Параметры счета
     * @returns Данные созданного счета
     */
    const createInvoice = async (params: CreateNowInvoiceParams): Promise<NowPaymentsCreateInvoiceResponse> => {
        try {
            const response = await api.post<NowPaymentsCreateInvoiceResponse>('/invoice', params);
            return response.data;
        } catch (error) {
            logger.error('Error creating NOWPayments invoice', { error, params });
            throw handleApiError(error);
        }
    };

    /**
     * Получает информацию о платеже по его ID
     * @param paymentId ID платежа
     * @returns Информация о платеже
     */
    const getPaymentStatus = async (paymentId: string): Promise<NowPaymentsPaymentStatusResponse> => {
        try {
            const response = await api.get<NowPaymentsPaymentStatusResponse>(`/payment/${paymentId}`);
            return response.data;
        } catch (error) {
            logger.error('Error getting NOWPayments payment status', { error, paymentId });
            throw handleApiError(error);
        }
    };

    /**
     * Проверяет подпись вебхука от NOWPayments
     * @param data Данные вебхука
     * @param signature Подпись вебхука
     * @returns true если подпись верна, иначе false
     */
    const validateWebhookSignature = (data: any, signature: string): boolean => {
        return validateNowPaymentsSignature(data, signature);
    };

    /**
     * Преобразует статус платежа из NOWPayments в стандартный статус системы
     * @param nowpaymentStatus Статус платежа NOWPayments
     * @returns Стандартный статус платежа
     */
    const mapPaymentStatus = (nowpaymentStatus: string): PaymentStatus => {
        return mapNowPaymentsStatus(nowpaymentStatus);
    };

    // Возвращаем публичный интерфейс API клиента
    return {
        createPayment,
        createInvoice,
        getPaymentStatus,
        validateWebhookSignature,
        mapPaymentStatus
    };
};

// Создаем и экспортируем экземпляр API клиента
export const nowpaymentsApi = createNowPaymentsApi(); 