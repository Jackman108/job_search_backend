/** Client/API PATCH must never set status / ownership columns (S2/S5). */

export const PAYMENT_ROW_PATCH_ALLOW = ['amount', 'payment_method'] as const;

export const CRYPTO_ROW_PATCH_ALLOW = [
    'amount',
    'currency',
    'crypto_address',
    'crypto_amount',
    'network',
    'wallet_provider',
    'transaction_hash',
    'expires_at',
] as const;

/** HTTP client PATCH — no status (webhooks use WEBPAY_INTERNAL_PATCH_ALLOW). */
export const WEBPAY_ROW_PATCH_ALLOW = [
    'amount',
    'currency',
    'wsb_order_num',
    'wsb_invoice_item_name',
    'wsb_total',
] as const;

export const WEBPAY_INTERNAL_PATCH_ALLOW = [...WEBPAY_ROW_PATCH_ALLOW, 'payment_status'] as const;

/** Strip forbidden keys; status only when allowlist includes it (webhook/internal). */
export function pickAllowedPatch<T extends Record<string, unknown>>(body: T, allow: readonly string[]): Partial<T> {
    const allowSet = new Set(allow);
    const out: Partial<T> = {};
    for (const [key, value] of Object.entries(body || {})) {
        if (value === undefined) continue;
        if (key === 'user_id' || key === 'id' || key === 'subscription_id' || key === 'payment_id') {
            continue;
        }
        if (!allowSet.has(key)) continue;
        (out as Record<string, unknown>)[key] = value;
    }
    return out;
}
