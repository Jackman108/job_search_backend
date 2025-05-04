import { executeQuery, generateUpdateQueryWithConditions, deleteFromCache, getFromCache, setToCache } from '@utils';
import { UpdateVacancySubmitData, VacancySubmitData } from '@interface';

const vacancySubmitCache = new Map<string, VacancySubmitData[] | null>();

export const createVacancySubmit = async (
    userId: string,
    submitData: Omit<VacancySubmitData, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> => {
    const query = `
        INSERT INTO vacancy_submit (
            user_id, position, message, vacancy_url, schedule, order_by, search_field, experience, search_period
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
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
    ];

    const result = await executeQuery(query, values);
    const id = result[0].id;

    deleteFromCache(vacancySubmitCache, userId);

    return id;
};

export const getVacancySubmitByUserId = async (userId: string): Promise<VacancySubmitData[] | null> => {
    const cachedData = getFromCache(vacancySubmitCache, userId);
    if (cachedData) {
        return cachedData;
    }

    const query = `SELECT * FROM vacancy_submit WHERE user_id = $1;`;
    const result = await executeQuery<VacancySubmitData>(query, [userId]);
    const data = result || [];
    setToCache(vacancySubmitCache, userId, data);

    return data;
};

export const updateVacancySubmit = async (
    userId: string,
    updates: UpdateVacancySubmitData
): Promise<void> => {
    const { query, values } = generateUpdateQueryWithConditions(
        "vacancy_submit",
        updates,
        { user_id: userId, id: updates.id })

    await executeQuery(query, values);

    deleteFromCache(vacancySubmitCache, userId);
};

export const deleteVacancySubmit = async (userId: string, fieldId: string): Promise<void> => {
    const query = `DELETE FROM vacancy_submit  WHERE user_id = $1 AND id = $2;`;
    await executeQuery(query, [userId, fieldId]);

    deleteFromCache(vacancySubmitCache, userId);
};
