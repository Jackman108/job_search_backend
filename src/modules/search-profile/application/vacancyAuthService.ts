import {
    executeQuery,
    generateUpdateQueryWithConditions,
    deleteFromCache,
    getFromCache,
    setToCache,
    checkTableExists,
    asListResult,
} from '../../../utils/index.js';
import { UpdateVacancyAuthData, VacancyAuthData } from '../../../interface/index.js';
import {
    decryptHhPassword,
    encryptHhPassword,
    HH_CRED_ENC_VERSION,
    resolveHhCredKey,
} from '../../../platform/crypto/hhCredCrypto.js';
import { logger } from '../../../utils/logger.js';

const vacancyAuthCache = new Map<string, VacancyAuthData[]>();

type VacancyAuthRow = {
    id: number;
    user_id: string;
    email: string;
    password?: string | null;
    password_enc?: string | null;
    enc_v?: number | null;
    created_at?: Date;
    updated_at?: Date;
};

function mapRow(row: VacancyAuthRow): VacancyAuthData {
    let password = '';
    if (row.password_enc) {
        try {
            password = decryptHhPassword(row.password_enc, resolveHhCredKey());
        } catch (err) {
            logger.error('Failed to decrypt vacancy_auth password_enc', {
                id: row.id,
                message: err instanceof Error ? err.message : String(err),
            });
            throw new Error('Stored HH credentials could not be decrypted. Re-save login/password on Отправка заявок.');
        }
    } else if (typeof row.password === 'string' && row.password.length > 0) {
        password = row.password;
    }

    return {
        id: row.id,
        user_id: row.user_id,
        email: row.email,
        password,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

/** Ensure shared HH login credentials table + ciphertext columns exist. */
export const ensureVacancyAuthTable = async (): Promise<void> => {
    const exists = await checkTableExists('vacancy_auth');
    if (!exists) {
        const query = `
            CREATE TABLE IF NOT EXISTS vacancy_auth (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password TEXT NOT NULL DEFAULT '',
                password_enc TEXT,
                enc_v SMALLINT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;
        await executeQuery(query);
        return;
    }

    await executeQuery(`ALTER TABLE vacancy_auth ADD COLUMN IF NOT EXISTS password_enc TEXT`);
    await executeQuery(`ALTER TABLE vacancy_auth ADD COLUMN IF NOT EXISTS enc_v SMALLINT`);
};

function encryptFields(plaintext: string): { password_enc: string; enc_v: number; password: string } {
    resolveHhCredKey();
    return {
        password_enc: encryptHhPassword(plaintext),
        enc_v: HH_CRED_ENC_VERSION,
        password: '',
    };
}

/** Create or update HH credentials for user+email (used before enqueue so job files need no password). */
export const upsertVacancyAuthCredentials = async (userId: string, email: string, password: string): Promise<void> => {
    if (!email?.trim() || !password?.trim()) {
        throw new Error('email and password are required to store HH credentials');
    }
    await ensureVacancyAuthTable();
    const existing = await getVacancyAuthByUserId(userId);
    const match = existing.find((a) => a.email === email) || existing[0];
    if (match?.id != null) {
        await updateVacancyAuth(userId, {
            id: Number(match.id),
            user_id: userId,
            email,
            password,
        });
        return;
    }
    await createVacancyAuth(userId, { email, password });
};

export const createVacancyAuth = async (
    userId: string,
    authData: Omit<VacancyAuthData, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
): Promise<string> => {
    await ensureVacancyAuthTable();
    const enc = encryptFields(authData.password);

    const query = `
        INSERT INTO vacancy_auth (user_id, email, password, password_enc, enc_v)
        VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `;
    const values = [userId, authData.email, enc.password, enc.password_enc, enc.enc_v];
    const result = await executeQuery(query, values);
    const id = result[0].id;

    deleteFromCache(vacancyAuthCache, userId);

    return id;
};

export const getVacancyAuthByUserId = async (userId: string): Promise<VacancyAuthData[]> => {
    const cachedData = getFromCache(vacancyAuthCache, userId);
    if (cachedData) {
        return cachedData;
    }

    await ensureVacancyAuthTable();

    const query = `SELECT * FROM vacancy_auth WHERE user_id = $1;`;
    const result = await executeQuery<VacancyAuthRow>(query, [userId]);

    // Lazy-upgrade legacy plaintext rows to ciphertext (before mapping/cache).
    for (const row of result) {
        if (!row.password_enc && typeof row.password === 'string' && row.password.length > 0) {
            try {
                const enc = encryptFields(row.password);
                await executeQuery(
                    `UPDATE vacancy_auth SET password_enc = $1, enc_v = $2, password = $3, updated_at = NOW()
                     WHERE id = $4 AND user_id = $5`,
                    [enc.password_enc, enc.enc_v, enc.password, row.id, userId],
                );
                row.password_enc = enc.password_enc;
                row.enc_v = enc.enc_v;
                row.password = '';
            } catch (err) {
                logger.warn('Lazy HH password encrypt failed', {
                    id: row.id,
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        }
    }

    const data = asListResult(result).map(mapRow);
    if (data.length > 0) {
        setToCache(vacancyAuthCache, userId, data);
    }

    return data;
};

export const updateVacancyAuth = async (userId: string, updates: UpdateVacancyAuthData): Promise<void> => {
    await ensureVacancyAuthTable();

    const patch: Record<string, unknown> = { ...updates };
    delete patch.id;
    delete patch.user_id;

    if (typeof patch.password === 'string') {
        if (patch.password.trim() === '') {
            delete patch.password;
        } else {
            const enc = encryptFields(patch.password);
            patch.password = enc.password;
            patch.password_enc = enc.password_enc;
            patch.enc_v = enc.enc_v;
        }
    }

    const { query, values } = generateUpdateQueryWithConditions('vacancy_auth', patch, {
        user_id: userId,
        id: updates.id,
    });

    await executeQuery(query, values);

    deleteFromCache(vacancyAuthCache, userId);
};

export const deleteVacancyAuth = async (userId: string, authId: string): Promise<void> => {
    await ensureVacancyAuthTable();

    const query = `DELETE FROM vacancy_auth WHERE user_id = $1 AND id = $2;`;
    await executeQuery(query, [userId, authId]);

    deleteFromCache(vacancyAuthCache, userId);
};
