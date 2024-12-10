import client from "../config/dbConfig.js";

// Выполнение запроса
export const executeQuery = async (query: string, values: any[] = []) => {
    try {
        const result = await client.query(query, values);
        return result.rows;
    } catch (err) {
        console.error("Database query error:", err);
        throw err;
    }
};

// Генерация запроса на обновление с ID
export const generateUpdateQuery = (
    tableName: string,
    updates: Record<string, any>,
    idFieldName: string,
    idValue: string | number
): { query: string; values: any[] } => {
    const {setClause, values} = generateSetClause(updates);
    if (setClause.length === 0) {
        throw new Error('No update fields provided');
    }

    const query = `
        UPDATE ${tableName}
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE ${idFieldName} = $${values.length + 1};
    `;
    values.push(idValue);

    return {query, values};
};

// Генерация запроса на обновление с условиями
export const generateUpdateQueryWithConditions = (
    tableName: string,
    updates: Record<string, any>,
    conditions: Record<string, any>
): { query: string; values: any[] } => {
    const {setClause, values} = generateSetClause(updates);
    if (setClause.length === 0) {
        throw new Error('No update fields provided');
    }

    const whereClause = generateWhereClause(conditions, values);

    const query = `
        UPDATE ${tableName}
        SET ${setClause.join(', ')}
        WHERE ${whereClause.join(' AND ')};
    `;

    return {query, values};
};

// Универсальная функция для генерации SET части запроса
const generateSetClause = (updates: Record<string, any>): { setClause: string[]; values: any[] } => {
    const setClause: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== "updated_at") {
            setClause.push(`${key} = $${values.length + 1}`);
            values.push(value);
        }
    });

    return {setClause, values};
};

// Универсальная функция для генерации WHERE части запроса
const generateWhereClause = (conditions: Record<string, any>, values: any[]): string[] => {
    const whereClause: string[] = [];

    Object.entries(conditions).forEach(([key, value]) => {
        whereClause.push(`${key} = $${values.length + 1}`);
        values.push(value);
    });

    return whereClause;
};
