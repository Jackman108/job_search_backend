import type { JobBroadcast } from './broadcast.types.js';
import { updateJob } from './store.js';

/** Pull first http(s) URL from a CAPTCHA broadcast line, if present. */
export function extractCaptchaSrc(message: string): string | undefined {
    if (!/CAPTCHA/i.test(message)) {
        return undefined;
    }
    const match = message.match(/https?:\/\/\S+/);
    return match?.[0];
}

/**
 * Persist worker progress onto the job file so GET /jobs/:id poll is SoT
 * (CAPTCHA / errors / last event) without a cross-process WS broker.
 */
export function createJobStoreBroadcast(jobId: string, inner: JobBroadcast): JobBroadcast {
    return {
        broadcast(message: string): void {
            inner.broadcast(message);
            const captchaSrc = extractCaptchaSrc(message);
            updateJob(jobId, {
                lastEvent: message,
                lastEventAt: new Date().toISOString(),
                ...(captchaSrc ? { captchaSrc } : {}),
            });
        },
    };
}
