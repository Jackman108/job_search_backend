/** Pure S6 webhook gate: signature → event key → claim → process. */

export type WebhookClaim = 'claimed' | 'duplicate';

export type WebhookGateDecision = 'reject_signature' | 'reject_event' | 'skip_duplicate' | 'process';

export function buildProviderEventId(provider: string, eventKey: string): string {
    return `${provider}:${eventKey}`;
}

export function resolveCryptoEventKey(data: Record<string, unknown>): string | null {
    const id = data.payment_id ?? data.id ?? data.order_id;
    if (id === undefined || id === null || String(id).trim() === '') return null;
    const status = data.payment_status ?? data.status ?? 'unknown';
    return `${String(id)}:${String(status)}`;
}

export function resolveWebpayEventKey(data: Record<string, unknown>): string | null {
    const order = data.wsb_order_num ?? data.order_num;
    if (order === undefined || order === null || String(order).trim() === '') return null;
    const tid = data.wsb_tid ?? data.transaction_id ?? 'none';
    const status = data.wsb_status ?? data.status ?? 'unknown';
    return `${String(order)}:${String(tid)}:${String(status)}`;
}

export function signaturesMatch(expectedHex: string, received: string): boolean {
    if (!expectedHex || !received) return false;
    if (expectedHex.length !== received.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expectedHex.length; i++) {
        mismatch |= expectedHex.charCodeAt(i) ^ received.charCodeAt(i);
    }
    return mismatch === 0;
}

export function decideWebhookGate(input: {
    signatureOk: boolean;
    eventKey: string | null;
    claim: WebhookClaim | null;
}): WebhookGateDecision {
    if (!input.signatureOk) return 'reject_signature';
    if (!input.eventKey) return 'reject_event';
    if (input.claim === 'duplicate') return 'skip_duplicate';
    if (input.claim === 'claimed') return 'process';
    return 'reject_event';
}
