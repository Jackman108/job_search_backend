import { CreateWebPayPaymentParams, IWebPayService, PaymentResult, PaymentStatus, WebPayPayment, WebPayPaymentData } from '@interface';
import { generateOrderNumber, getPaymentIdByUserId, withErrorHandling } from '@integrations';
import { checkTableExists, executeQuery, generateUpdateQueryWithConditions, } from '@utils';

/**
 * @module WebpayService
 * @description Сервис для управления WebPay платежами в БД
 * Этот модуль содержит функции для:
 * - Создания и управления таблицей webpay_payments
 * - CRUD операций с WebPay платежами
 * - Безопасных операций с обработкой ошибок
 */

/**
 * Создание таблицы webpay_payments с необходимыми полями
 */
export const createTableWebpayPayments = async (): Promise<void> => {
    const exists = await checkTableExists('webpay_payments');
    if (exists) return;

    const query = `
    CREATE TABLE IF NOT EXISTS webpay_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
        wsb_order_num VARCHAR(100) NOT NULL,
        wsb_currency_id VARCHAR(10) NOT NULL,
        wsb_total DECIMAL(10,2) NOT NULL,
        transaction_id VARCHAR(100),
        payment_status VARCHAR(20) DEFAULT 'pending',
        signature VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        success_url VARCHAR(255),
        cancel_url VARCHAR(255),
        UNIQUE(wsb_order_num)
    );
    
    CREATE INDEX IF NOT EXISTS idx_webpay_payment_id ON webpay_payments(payment_id);
    CREATE INDEX IF NOT EXISTS idx_webpay_order_num ON webpay_payments(wsb_order_num);
    `;

    await executeQuery(query);
};

/**
 * Получение всех WebPay платежей
 */
export const listWebpayPayments = async (): Promise<WebPayPayment[]> => {
    const query = `SELECT * FROM webpay_payments ORDER BY created_at DESC;`;
    return await executeQuery<WebPayPayment>(query);
};

/**
 * Получение активного (незавершенного) криптоплатежа
 * @param paymentId ID платежа в таблице payments
 * @param webpayPaymentId ID webpay платежа
 */
export const getActiveWebpayPayment = async (
    paymentId: string,
    webpayPaymentId: string
): Promise<WebPayPayment | null> => {
    const query = `
        SELECT * FROM webpay_payments
        WHERE payment_id = $1 AND id = $2 AND payment_status = $3
        LIMIT 1;
    `;
    const result = await executeQuery<WebPayPayment>(query, [paymentId, webpayPaymentId, PaymentStatus.Pending]);
    return result.length > 0 ? result[0] : null;
};


/**
 * Получение WebPay платежа по ID
 * @param userId ID пользователя
 * @param webpayPaymentId ID платежа WebPay
 */
export const getWebpayPayment = async (userId: string, webpayPaymentId: string): Promise<WebPayPayment | null> => {
    const paymentId = await getPaymentIdByUserId(userId);
    const query = `SELECT * FROM webpay_payments WHERE payment_id = $1 AND id = $2;`;
    const result = await executeQuery<WebPayPayment>(query, [paymentId, webpayPaymentId]);
    if (!result[0]) throw new Error(`WebPay payment not found for id ${webpayPaymentId}`);
    return result[0];
};

/**
 * Получение WebPay платежа по номеру заказа
 * @param orderNum Номер заказа WebPay
 */
export const getWebpayPaymentByOrderNum = async (orderNum: string): Promise<WebPayPayment | null> => {
    const query = `SELECT * FROM webpay_payments WHERE wsb_order_num = $1;`;
    const result = await executeQuery<WebPayPayment>(query, [orderNum]);
    return result[0] || null;
};

/**
 * Получение WebPay платежа по ID платежа
 * @param paymentId ID платежа
 */
export const getWebpayPaymentByPaymentId = async (paymentId: string): Promise<WebPayPayment | null> => {
    const query = `SELECT * FROM webpay_payments WHERE payment_id = $1;`;
    const result = await executeQuery<WebPayPayment>(query, [paymentId]);
    return result[0] || null;
};

/**
 * Создание нового WebPay платежа
 * @param webpayData Данные для создания WebPay платежа
 */
export const createWebpayPayment = async (
    webpayData: WebPayPaymentData
): Promise<WebPayPayment> => {
    // Проверяем наличие активного платежа только если id определен
    let activeWebpayPayment = null;
    if (webpayData.id) {
        activeWebpayPayment = await getActiveWebpayPayment(webpayData.payment_id, webpayData.id);
    }
    if (activeWebpayPayment) return activeWebpayPayment;

    const query = `
    INSERT INTO webpay_payments (
         payment_id, wsb_order_num,  wsb_currency_id,
        wsb_total, transaction_id, payment_status, signature,
        success_url, cancel_url, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
`;
    const values = [
        webpayData.payment_id,
        webpayData.wsb_order_num || '',
        webpayData.wsb_currency_id || '',
        webpayData.wsb_total || 0,
        webpayData.transaction_id || '',
        webpayData.payment_status || PaymentStatus.Pending,
        webpayData.signature || '',
        webpayData.success_url || '',
        webpayData.cancel_url || '',
        webpayData.created_at || new Date(),
        webpayData.updated_at || new Date()
    ];


    const [result] = await executeQuery<WebPayPayment>(query, values);
    return result;
};

/**
 * Обновление WebPay платежа
 * @param id ID WebPay платежа
 * @param updates Поля для обновления
 */
export const updateWebpayPayment = async (
    paymentId: string,
    updates: Partial<WebPayPayment>
): Promise<WebPayPayment> => {
    if (!updates.payment_id) {
        throw new Error('Payment ID is required for updating webpay payment');
    }

    const { query, values } = generateUpdateQueryWithConditions(
        'webpay_payments',
        { ...updates, updated_at: new Date() },
        { id: paymentId }
    );

    await executeQuery(query, values);

    // Получаем обновлённую запись
    const selectQuery = `SELECT * FROM webpay_payments WHERE id = $1;`;
    const result = await executeQuery<WebPayPayment>(selectQuery, [paymentId]);
    if (!result[0]) throw new Error(`webpay payment not found for id ${paymentId}`);
    return result[0];
};

/**
 * Обновление WebPay платежа по номеру заказа
 * @param orderNum Номер заказа WebPay
 * @param updates Поля для обновления
 */
export const updateWebpayPaymentByOrderNum = async (
    orderNum: string,
    updates: Partial<WebPayPayment>
): Promise<WebPayPayment | null> => {
    const { query, values } = generateUpdateQueryWithConditions(
        'webpay_payments',
        { ...updates, updated_at: new Date() },
        { wsb_order_num: orderNum }
    );

    await executeQuery(query, values);

    // Получаем обновлённые данные
    return await getWebpayPaymentByOrderNum(orderNum);
};

/**
 * Удаление WebPay платежа
 * @param userId ID пользователя
 * @param webpayPaymentId ID WebPay платежа
 */
export const deleteWebpayPayment = async (
    userId: string, webpayPaymentId: string
): Promise<void> => {
    const paymentId = await getPaymentIdByUserId(userId);
    const query = `DELETE FROM webpay_payments WHERE payment_id = $1 AND id = $2;`;
    await executeQuery(query, [paymentId, webpayPaymentId]);
};

/**
 * Проверяет и удаляет существующий WebPay платеж при переключении на криптоплатеж
 * @param paymentId ID платежа
 */
export const deletePendingWebPayPayment = async (paymentId: string): Promise<void> => {
    const query = `
        DELETE FROM webpay_payments 
        WHERE payment_id = $1 AND payment_status = $2
    `;
    await executeQuery(query, [paymentId, PaymentStatus.Pending]);
    console.log(`Deleted pending WebPay payments for payment: ${paymentId}`);
};



/**
 * Реализация интерфейса IWebPayService
 */
export const webpayService: IWebPayService = {
    // Методы для поддержки WebpayController
    listPayments: async () => {
        return withErrorHandling(async () => {
            return await listWebpayPayments();
        });
    },

    getPayment: async (userId: string, paymentId: string) => {
        return withErrorHandling(async () => {
            const payment = await getWebpayPayment(userId, paymentId);
            if (!payment) {
                throw new Error(`WebPay payment not found for id ${paymentId}`);
            }
            return payment;
        });
    },

    createPayment: async (params: CreateWebPayPaymentParams) => {
        return withErrorHandling(async () => {
            // Создаем объект WebPayPaymentData из параметров CreateWebPayPaymentParams
            const webpayData = {
                payment_id: params.payment_id,
                wsb_order_num: generateOrderNumber(),
                wsb_currency_id: params.currency || 'USD',
                wsb_total: params.amount,
                transaction_id: null,
                payment_status: PaymentStatus.Pending,
                signature: null,
                created_at: new Date(),
                updated_at: new Date(),
                success_url: params.success_url || null,
                cancel_url: params.cancel_url || null,
            };

            return await createWebpayPayment(webpayData);
        });
    },

    updatePayment: async (paymentId: string, updates: Partial<WebPayPayment>) => {
        return withErrorHandling(async () => {
            const payment = await updateWebpayPayment(paymentId, updates);
            if (!payment) {
                throw new Error(`WebPay payment not found for id ${paymentId}`);
            }
            return payment;
        });
    },

    deletePayment: async (userId: string, paymentId: string): Promise<PaymentResult<boolean>> => {
        return withErrorHandling(async () => {
            await deleteWebpayPayment(userId, paymentId);
            return true;
        });
    }
}; 