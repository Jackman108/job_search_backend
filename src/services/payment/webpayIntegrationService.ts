import crypto from 'crypto';
import type { WebpayInitParams, WebpayInitResult } from '@interface';
import { WEBPAY_API_BASE_URL, WEBPAY_SECRET_KEY } from '@config';

/**
 * Инициализация платежа через WebPay (Host-to-Host JSON API)
 */
export async function initWebpayPayment(
    params: WebpayInitParams
): Promise<WebpayInitResult> {
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