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
    PaymentStatus,
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
    const configured = Boolean(apiKey);

    if (!configured) {
        // Optional integration — warn once at load; do not paint startup as ERROR.
        logger.warn(
            'NOWPayments API key is not configured; crypto payment calls will fail until set (optional in local dev)',
        );
    }

    const api = axios.create({
        baseURL: nowPaymentsConfig.baseUrl,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        timeout: 10000,
    });

    api.interceptors.request.use(
        (config) => {
            if (configured) {
                logger.info('NOWPayments API request', {
                    method: config.method,
                    url: config.url,
                });
            }
            return config;
        },
        (error) => {
            logger.warn('NOWPayments API request setup failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            return Promise.reject(error);
        },
    );

    api.interceptors.response.use(
        (response) => {
            if (configured) {
                logger.info('NOWPayments API response', {
                    status: response.status,
                });
            }
            return response;
        },
        (error) => {
            // Missing key / unused crypto path — warn, don't spam ERROR on every call.
            const level = configured ? 'error' : 'warn';
            logger[level]('NOWPayments API response error', {
                error: error.message,
                response: error.response?.data,
            });
            return Promise.reject(error);
        },
    );

    const handleApiError = (error: any): Error => {
        if (error.response) {
            const { status, data } = error.response;
            const message = data?.message || 'Unknown NOWPayments API error';
            return new Error(`NOWPayments API error (${status}): ${message}`);
        }
        if (error.request) {
            return new Error(`NOWPayments API no response: ${error.message}`);
        }
        return new Error(`NOWPayments API request error: ${error.message}`);
    };

    const logCallFailure = (op: string, error: unknown, extra?: Record<string, unknown>) => {
        const level = configured ? 'error' : 'warn';
        logger[level](`NOWPayments ${op} failed`, {
            error: error instanceof Error ? error.message : String(error),
            ...extra,
        });
    };

    const createPayment = async (params: CreateNowPaymentParams): Promise<NowPaymentsCreatePaymentResponse> => {
        try {
            const response = await api.post<NowPaymentsCreatePaymentResponse>('/payment', params);
            return response.data;
        } catch (error) {
            logCallFailure('createPayment', error);
            throw handleApiError(error);
        }
    };

    const createInvoice = async (params: CreateNowInvoiceParams): Promise<NowPaymentsCreateInvoiceResponse> => {
        try {
            const response = await api.post<NowPaymentsCreateInvoiceResponse>('/invoice', params);
            return response.data;
        } catch (error) {
            logCallFailure('createInvoice', error);
            throw handleApiError(error);
        }
    };

    const getPaymentStatus = async (paymentId: string): Promise<NowPaymentsPaymentStatusResponse> => {
        try {
            const response = await api.get<NowPaymentsPaymentStatusResponse>(`/payment/${paymentId}`);
            return response.data;
        } catch (error) {
            logCallFailure('getPaymentStatus', error, { paymentId });
            throw handleApiError(error);
        }
    };

    const validateWebhookSignature = (data: any, signature: string): boolean => {
        return validateNowPaymentsSignature(data, signature);
    };

    const mapPaymentStatus = (nowpaymentStatus: string): PaymentStatus => {
        return mapNowPaymentsStatus(nowpaymentStatus);
    };

    return {
        createPayment,
        createInvoice,
        getPaymentStatus,
        validateWebhookSignature,
        mapPaymentStatus,
    };
};

export const nowpaymentsApi = createNowPaymentsApi();
