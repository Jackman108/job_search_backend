import { executeQuery, generateUpdateQueryWithConditions } from "../../utils/queryHelpers.js";
import { UpdateVacancyAuthData, VacancyAuthData } from "../../interface/index.js";
import { deleteFromCache, getFromCache, setToCache } from "../../utils/cacheService.js";

const vacancyAuthCache = new Map<string, VacancyAuthData[]>();

export const createVacancyAuth = async (
    userId: string,
    authData: Omit<VacancyAuthData, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> => {
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

    const query = `SELECT * FROM vacancy_auth WHERE user_id = $1;`;
    const result = await executeQuery<VacancyAuthData>(query, [userId]);
    const data = result || [];
    setToCache(vacancyAuthCache, userId, data);

    return data;
};

export const updateVacancyAuth = async (
    userId: string,
    updates: UpdateVacancyAuthData
): Promise<void> => {
    const { query, values } = generateUpdateQueryWithConditions(
        "vacancy_auth",
        updates,
        { user_id: userId, id: updates.id })

    await executeQuery(query, values);

    deleteFromCache(vacancyAuthCache, userId);
};

export const deleteVacancyAuth = async (userId: string, authId: string): Promise<void> => {
    const query = `DELETE FROM vacancy_auth WHERE user_id = $1 AND id = $2;`;
    await executeQuery(query, [userId, authId]);

    deleteFromCache(vacancyAuthCache, userId);
};
