import crypto from 'crypto';
import type { WebpayInitParams, WebpayInitResult, WebPayPayment } from '@interface';
import { WEBPAY_API_BASE_URL, WEBPAY_SECRET_KEY, USE_MOCK_PROVIDER } from '@config';
import { checkTableExists, executeQuery, generateUpdateQueryWithConditions } from '@utils';
import { PaymentStatus } from '@interface';
import { mockWebPayResponse } from '../../mock/mockWebPayResponse';

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
 * Получение WebPay платежа по ID
 * @param id ID платежа WebPay
 */
export const getWebpayPaymentById = async (id: string): Promise<WebPayPayment | null> => {
    const query = `SELECT * FROM webpay_payments WHERE id = $1;`;
    const result = await executeQuery<WebPayPayment>(query, [id]);
    return result[0] || null;
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
 * Получение WebPay платежа по ID основного платежа
 * @param paymentId ID основного платежа
 */
export const getWebpayPaymentByPaymentId = async (paymentId: string): Promise<WebPayPayment | null> => {
    const query = `SELECT * FROM webpay_payments WHERE payment_id = $1;`;
    const result = await executeQuery<WebPayPayment>(query, [paymentId]);
    return result[0] || null;
};

/**
 * Создание нового WebPay платежа
 * @param webpayPayment Данные для создания WebPay платежа
 */
export const createWebpayPayment = async (
    webpayPayment: Partial<WebPayPayment>
): Promise<WebPayPayment> => {
    const {
        payment_id,
        wsb_order_num,
        wsb_currency_id,
        wsb_total,
        transaction_id = null,
        payment_status = PaymentStatus.Pending,
        signature = null,
        success_url = null,
        cancel_url = null
    } = webpayPayment;

    const query = `
        INSERT INTO webpay_payments (
            payment_id,
            wsb_order_num,
            wsb_currency_id,
            wsb_total,
            transaction_id,
            payment_status,
            signature,
            success_url,
            cancel_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
    `;

    const values = [
        payment_id,
        wsb_order_num,
        wsb_currency_id,
        wsb_total,
        transaction_id,
        payment_status,
        signature,
        success_url,
        cancel_url
    ];

    const [created] = await executeQuery<WebPayPayment>(query, values);
    return created;
};

/**
 * Обновление WebPay платежа
 * @param id ID WebPay платежа
 * @param updates Поля для обновления
 */
export const updateWebpayPayment = async (
    id: string,
    updates: Partial<WebPayPayment>
): Promise<WebPayPayment | null> => {
    const { query, values } = generateUpdateQueryWithConditions(
        'webpay_payments',
        { ...updates, updated_at: new Date() },
        { id }
    );

    await executeQuery(query, values);

    // Получаем обновлённые данные
    return await getWebpayPaymentById(id);
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
 * @param id ID WebPay платежа
 */
export const deleteWebpayPayment = async (id: string): Promise<boolean> => {
    const query = `DELETE FROM webpay_payments WHERE id = $1 RETURNING id;`;
    const result = await executeQuery(query, [id]);
    return result.length > 0;
};

/**
 * Упрощенная версия инициализации платежа через WebPay для контроллеров
 * @param params Упрощенные параметры платежа
 */
export async function initSimpleWebpayPayment(params: {
    subscription_id: string;
    amount: number;
    currency: string;
}): Promise<WebpayInitResult> {
    const { subscription_id, amount, currency } = params;

    // Генерируем уникальный номер заказа
    const orderNum = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Создаем полный объект WebpayInitParams
    const webpayParams: WebpayInitParams = {
        wsb_seed: Date.now().toString(),
        wsb_storeid: Number(process.env.WEBPAY_STORE_ID || '000000'),
        wsb_order_num: orderNum,
        wsb_test: USE_MOCK_PROVIDER ? 1 : 0,
        wsb_currency_id: currency as "BYN" | "USD" | "EUR" | "RUB",
        wsb_total: amount,
        wsb_version: 2,
        wsb_return_url: process.env.WEBPAY_RETURN_URL || 'http://localhost:8000/api/webpay/return',
        wsb_cancel_return_url: process.env.WEBPAY_CANCEL_URL || 'http://localhost:8000/api/webpay/cancel',
        wsb_notify_url: process.env.WEBPAY_NOTIFY_URL || 'http://localhost:8000/api/webpay/notify',
        wsb_invoice_item_name: ['Subscription'],
        wsb_invoice_item_quantity: [1],
        wsb_invoice_item_price: [amount]
    };

    // Вызываем основную функцию инициализации WebPay
    return initWebpayPayment(webpayParams);
}

/**
 * Инициализация платежа через WebPay (Host-to-Host JSON API)
 * В режиме разработки использует моковые данные
 */
export async function initWebpayPayment(
    params: WebpayInitParams
): Promise<WebpayInitResult> {
    // В режиме разработки возвращаем моковые данные
    if (USE_MOCK_PROVIDER) {
        console.log('Using mock WebPay response in development mode');
        return {
            wt: mockWebPayResponse.wt,
            redirectUrl: mockWebPayResponse.redirectUrl
        };
    }

    // В продакшене делаем реальный запрос к WebPay
    const {
        wsb_seed,
        wsb_storeid,
        wsb_order_num,
        wsb_test,
        wsb_currency_id,
        wsb_total,
        ...rest
    } = params;

    // Формирование подписи SHA1: seed+storeid+order_num+test+currency+total+secret_key
    const signaturePayload =
        `${wsb_seed}${wsb_storeid}${wsb_order_num}${wsb_test}${wsb_currency_id}${wsb_total}${WEBPAY_SECRET_KEY}`;
    const wsb_signature = crypto
        .createHash('sha1')
        .update(signaturePayload)
        .digest('hex');
    const requestBody = {
        ...rest,
        wsb_seed,
        wsb_storeid,
        wsb_order_num,
        wsb_test,
        wsb_currency_id,
        wsb_total,
        wsb_signature,
    };

    const response = await fetch(WEBPAY_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WebPay error ${response.status}: ${errorText}`);
    }

    const json =
        (await response.json()) as { data: { wt: string; redirectUrl: string } };

    return {
        wt: json.data.wt,
        redirectUrl: json.data.redirectUrl,
    };
}

/**
 * Проверяет подпись уведомления от WebPay
 * @param payload Данные уведомления
 * @param signature Подпись из заголовка x-webpay-signature
 * @returns true если подпись валидна, false в противном случае
 */
export function validateWebpaySignature(payload: any, signature: string): boolean {
    // В режиме разработки всегда считаем подпись валидной
    if (USE_MOCK_PROVIDER) {
        console.log('Using mock signature validation in development mode');
        return true;
    }

    if (!payload || !signature || !WEBPAY_SECRET_KEY) {
        return false;
    }

    try {
        // Формирование строки для подписи из полей уведомления
        const { wsb_order_num, wsb_tid, wsb_status, wsb_amount } = payload;

        if (!wsb_order_num || !wsb_status) {
            return false;
        }

        // Формирование подписи по алгоритму WebPay: order_num+tid+status+amount+secret_key
        const signaturePayload = `${wsb_order_num}${wsb_tid || ''}${wsb_status}${wsb_amount || ''}${WEBPAY_SECRET_KEY}`;
        const expectedSignature = crypto
            .createHash('sha1')
            .update(signaturePayload)
            .digest('hex');

        // Сравнение подписей
        return expectedSignature === signature;
    } catch (error) {
        console.error('Error validating WebPay signature:', error);
        return false;
    }
} 