import {
    executeQuery,
    generateUpdateQueryWithConditions,
    deleteFromCache,
    getFromCache,
    setToCache,
    checkTableExists,
} from '@utils';
import { UpdateVacancyAuthData, VacancyAuthData } from '@interface';

const vacancyAuthCache = new Map<string, VacancyAuthData[]>();

/** Ensure shared HH login credentials table exists (fresh local DBs omit it). */
export const ensureVacancyAuthTable = async (): Promise<void> => {
    const exists = await checkTableExists('vacancy_auth');
    if (exists) {
        return;
    }

    const query = `
        CREATE TABLE IF NOT EXISTS vacancy_auth (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `;
    await executeQuery(query);
};

export const createVacancyAuth = async (
    userId: string,
    authData: Omit<VacancyAuthData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
    await ensureVacancyAuthTable();

    const query = `
        INSERT INTO vacancy_auth ( user_id, email, password)
        VALUES ($1, $2, $3) RETURNING id;
    `;
    const values = [userId, authData.email, authData.password];
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
    const result = await executeQuery<VacancyAuthData>(query, [userId]);
    // Empty list is a valid resource state — REST 200 + [].
    // Do not cache empty: avoids stale [] after migrate/seed without process restart.
    const data = result || [];
    if (data.length > 0) {
        setToCache(vacancyAuthCache, userId, data);
    }

    return data;
};

export const updateVacancyAuth = async (userId: string, updates: UpdateVacancyAuthData): Promise<void> => {
    await ensureVacancyAuthTable();

    const { query, values } = generateUpdateQueryWithConditions('vacancy_auth', updates, {
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
