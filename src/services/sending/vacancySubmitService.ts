import {
    executeQuery,
    generateUpdateQueryWithConditions,
    deleteFromCache,
    getFromCache,
    setToCache,
    checkTableExists,
    asListResult,
} from '@utils';
import { UpdateVacancySubmitData, VacancySubmitData } from '@interface';
import { deleteVacancyAuth } from './vacancyAuthService.js';

const vacancySubmitCache = new Map<string, VacancySubmitData[]>();

/** Ensure shared search-field / submit config table exists (fresh local DBs omit it). */
export const ensureVacancySubmitTable = async (): Promise<void> => {
    const exists = await checkTableExists('vacancy_submit');
    if (!exists) {
        const query = `
            CREATE TABLE IF NOT EXISTS vacancy_submit (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                position TEXT,
                message TEXT,
                vacancy_url TEXT,
                schedule TEXT,
                order_by TEXT,
                search_field TEXT,
                experience TEXT,
                search_period TEXT,
                vacancy_auth_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;
        await executeQuery(query);
    }

    await executeQuery(`
        ALTER TABLE vacancy_submit
        ADD COLUMN IF NOT EXISTS vacancy_auth_id INTEGER;
    `);
};

export const createVacancySubmit = async (
    userId: string,
    submitData: Omit<VacancySubmitData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
    await ensureVacancySubmitTable();

    const query = `
        INSERT INTO vacancy_submit (
            user_id, position, message, vacancy_url, schedule, order_by, search_field, experience, search_period,
            vacancy_auth_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;
    `;
    const values = [
        userId,
        submitData.position,
        submitData.message,
        submitData.vacancy_url,
        submitData.schedule,
        submitData.order_by,
        submitData.search_field,
        submitData.experience,
        submitData.search_period,
        submitData.vacancy_auth_id ?? null,
    ];

    const result = await executeQuery(query, values);
    const id = result[0].id;

    deleteFromCache(vacancySubmitCache, userId);

    return id;
};

export const getVacancySubmitByUserId = async (userId: string): Promise<VacancySubmitData[]> => {
    const cachedData = getFromCache(vacancySubmitCache, userId);
    if (cachedData) {
        return cachedData;
    }

    await ensureVacancySubmitTable();

    const query = `SELECT * FROM vacancy_submit WHERE user_id = $1;`;
    const result = await executeQuery<VacancySubmitData>(query, [userId]);
    // Empty list is a valid resource state — REST 200 + [].
    // Do not cache empty: avoids stale [] after migrate/seed without process restart.
    const data = asListResult(result);
    if (data.length > 0) {
        setToCache(vacancySubmitCache, userId, data);
    }

    return data;
};

export const updateVacancySubmit = async (userId: string, updates: UpdateVacancySubmitData): Promise<void> => {
    await ensureVacancySubmitTable();

    const { query, values } = generateUpdateQueryWithConditions('vacancy_submit', updates, {
        user_id: userId,
        id: updates.id,
    });

    await executeQuery(query, values);

    deleteFromCache(vacancySubmitCache, userId);
};

export const deleteVacancySubmit = async (userId: string, fieldId: string): Promise<void> => {
    await ensureVacancySubmitTable();

    const linkResult = await executeQuery<{ vacancy_auth_id: number | null }>(
        `SELECT vacancy_auth_id FROM vacancy_submit WHERE user_id = $1 AND id = $2;`,
        [userId, fieldId],
    );
    const linkedAuthId = linkResult[0]?.vacancy_auth_id;

    const query = `DELETE FROM vacancy_submit  WHERE user_id = $1 AND id = $2;`;
    await executeQuery(query, [userId, fieldId]);

    if (linkedAuthId != null) {
        await deleteVacancyAuth(userId, String(linkedAuthId));
    }

    deleteFromCache(vacancySubmitCache, userId);
};
