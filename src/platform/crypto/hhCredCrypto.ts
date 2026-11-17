import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ENV } from '@config';
import { logger } from '../../utils/logger.js';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
export const HH_CRED_ENC_VERSION = 1;

/** Dev-only zero key (32 bytes). Never use in production. */
const DEV_ZERO_KEY_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export type HhCredKeyCheck = {
    ok: boolean;
    reason?: string;
};

export function evaluateHhCredKey(raw: string | undefined): HhCredKeyCheck {
    if (!raw || !raw.trim()) {
        return { ok: false, reason: 'HH_CRED_KEY is missing or empty' };
    }
    let buf: Buffer;
    try {
        buf = Buffer.from(raw.trim(), 'base64');
    } catch {
        return { ok: false, reason: 'HH_CRED_KEY is not valid base64' };
    }
    if (buf.length !== KEY_LEN) {
        return {
            ok: false,
            reason: `HH_CRED_KEY must decode to ${KEY_LEN} bytes (got ${buf.length})`,
        };
    }
    if (ENV.isProduction && raw.trim() === DEV_ZERO_KEY_B64) {
        return { ok: false, reason: 'HH_CRED_KEY must not be the documented zero/dev key in production' };
    }
    return { ok: true };
}

let cachedKey: Buffer | null = null;

/**
 * Resolve AES key for HH passwords.
 * Production: fail boot if missing/weak.
 * Development: warn and use zero key so local smoke works without extra setup
 * (operator should still set a real key + offline backup — D2).
 */
export function resolveHhCredKey(): Buffer {
    if (cachedKey) {
        return cachedKey;
    }
    const raw = process.env.HH_CRED_KEY;
    const check = evaluateHhCredKey(raw);
    if (check.ok && raw) {
        cachedKey = Buffer.from(raw.trim(), 'base64');
        return cachedKey;
    }

    const message = check.reason || 'Invalid HH_CRED_KEY';
    if (ENV.isProduction) {
        throw new Error(
            `[boot] ${message}. Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" and keep an offline backup.`,
        );
    }

    logger.warn(
        `[boot] ${message}. Continuing in ${ENV.NODE_ENV} with ZERO dev key — set HH_CRED_KEY and keep a local backup (D2).`,
    );
    cachedKey = Buffer.from(DEV_ZERO_KEY_B64, 'base64');
    return cachedKey;
}

/** Reset cache (tests). */
export function resetHhCredKeyCache(): void {
    cachedKey = null;
}

/**
 * Encrypt plaintext password.
 * Wire format: base64(iv) . base64(tag) . base64(ciphertext)
 */
export function encryptHhPassword(plaintext: string, key = resolveHhCredKey()): string {
    if (!plaintext) {
        throw new Error('Cannot encrypt empty HH password');
    }
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
}

export function decryptHhPassword(payload: string, key = resolveHhCredKey()): string {
    const parts = payload.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid HH password_enc format');
    }
    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
        throw new Error('Invalid HH password_enc iv/tag length');
    }
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
