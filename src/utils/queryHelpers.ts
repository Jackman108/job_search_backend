import { logError } from "@utils";
import pool from "src/config/database.config";


export const executeQuery = async <T = any>(query: string, values: any[] = []): Promise<T[]> => {
    if (!pool) {
        throw new Error('Database pool is not initialized');
    }

    const client = await pool.connect();

    try {
        const result = await client.query(query, values);
        return result.rows as T[];
    } catch (err) {
        logError(err as Error, query, values);
        throw new Error(`Database operation failed: ${(err as Error).message}`);
    } finally {
        client.release();
    }
};


export const generateUpdateQuery = (
    tableName: string,
    updates: Record<string, any>,
    idFieldName: string,
    idValue: string | number
): {
    query: string; values: any[]
} => {
    const { setClause, values } = generateSetClause(updates);
    if (setClause.length === 0) {
        throw new Error('No update fields provided');
    }

    const query = `
        UPDATE ${tableName}
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE ${idFieldName} = $${values.length + 1};
    `;
    values.push(idValue);

    return { query, values };
};


export const generateUpdateQueryWithConditions = (
    tableName: string,
    updates: Record<string, any>,
    conditions: Record<string, any>
): { query: string; values: any[] } => {
    const { setClause, values } = generateSetClause(updates);
    if (setClause.length === 0) {
        throw new Error('No update fields provided');
    }

    const whereClause = generateWhereClause(conditions, values);
    if (whereClause.length === 0) {
        throw new Error('No conditions provided');
    }
    const query = `
        UPDATE ${tableName}
        SET ${setClause.join(', ')}
        WHERE ${whereClause.join(' AND ')};
    `;

    return { query, values };
};


export const generateSetClause = (updates: Record<string, any>): {
    setClause: string[]; values: any[]
} => {
    const setClause: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value], index) => {
        if (value !== undefined && key !== "updated_at") {
            setClause.push(`${key} = COALESCE($${index + 1}, ${key})`);
            values.push(value);
        }
    });

    return { setClause, values };
};


const generateWhereClause = (conditions: Record<string, any>, values: any[]): string[] => {
    const whereClause: string[] = [];

    Object.entries(conditions).forEach(([key, value]) => {
        whereClause.push(`${key} = $${values.length + 1}`);
        values.push(value);
    });

    return whereClause;
};


export async function checkTableExists(tableName: string): Promise<boolean> {
    const query = `SELECT to_regclass('public.${tableName}');`;
    const result = await executeQuery(query);
    return result[0]?.to_regclass !== null;
}


export async function deleteTable(userId: string, tableName: string): Promise<void> {
    const fullTableName = `"${userId}_${tableName}"`;
    const query = `DROP TABLE IF EXISTS ${fullTableName}`;
    await executeQuery(query);
}

export const getSubscriptionIdByUserId = async (userId: string): Promise<string> => {
    const query = `
        SELECT * FROM subscriptions 
        WHERE user_id = $1 AND end_date > NOW()
        ORDER BY end_date DESC
        LIMIT 1;
    `;
    const result = await executeQuery(query, [userId]);
    return result[0]?.id;
};