const SENSITIVE_KEY =
    /^(password|passwd|pwd|token|access_token|refresh_token|authorization|cookie|secret|api_key|apikey|hh_cred_key|card|cvv)$/i;

const MAX_DEPTH = 6;

function redactString(value: string): string {
    if (value.length <= 4) return '[REDACTED]';
    return `[REDACTED len=${value.length}]`;
}

/** Deep-clone meta and mask sensitive keys (password, token, …). */
export function redact(meta: unknown, depth = 0): unknown {
    if (meta == null || depth > MAX_DEPTH) {
        return meta;
    }
    if (typeof meta === 'string') {
        return meta;
    }
    if (Array.isArray(meta)) {
        return meta.map((item) => redact(item, depth + 1));
    }
    if (typeof meta !== 'object') {
        return meta;
    }

    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
        if (SENSITIVE_KEY.test(key)) {
            out[key] = typeof value === 'string' ? redactString(value) : '[REDACTED]';
            continue;
        }
        out[key] = redact(value, depth + 1);
    }
    return out;
}
