// workExperienceService.ts
import client from "../../config/dbConfig.js";

export const getExperienceUser = async (userId: string): Promise<any[]> => {
    const query = `SELECT * FROM work_experience WHERE user_id = $1`;
    try {
        const result = await client.query(query, [userId]);
        return result.rows;
    } catch (err) {
        console.error(`Error retrieving work experience for user ${userId}:`, err);
        throw err;
    }
};

export const createExperienceUser = async (
    userId: string,
    experienceData: {
        company_name: string;
        position: string;
        start_date: Date;
        end_date: Date;
        description: string;
    }
): Promise<string> => {
    const insertExperienceQuery = `
        INSERT INTO work_experience (user_id, company_name, position, start_date, end_date, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
    `;

    const values = [
        userId,
        experienceData.company_name,
        experienceData.position,
        experienceData.start_date,
        experienceData.end_date,
        experienceData.description,
    ];

    try {
        const result = await client.query(insertExperienceQuery, values);
        return result.rows[0].id;
    } catch (err) {
        console.error('Error creating work experience:', err);
        throw err;
    }
};

export const updateExperienceUser = async (
    userId: string,
    experienceId: string,
    updates: {
        company_name?: string;
        position?: string;
        start_date?: Date;
        end_date?: Date;
        description?: string;
    }
): Promise<void> => {
    const setClause: string[] = [];
    const values: any[] = [];

    if (updates.company_name) {
        setClause.push(`company_name = $${values.length + 1}`);
        values.push(updates.company_name);
    }
    if (updates.position) {
        setClause.push(`position = $${values.length + 1}`);
        values.push(updates.position);
    }
    if (updates.start_date) {
        setClause.push(`start_date = $${values.length + 1}`);
        values.push(updates.start_date);
    }
    if (updates.end_date) {
        setClause.push(`end_date = $${values.length + 1}`);
        values.push(updates.end_date);
    }
    if (updates.description) {
        setClause.push(`description = $${values.length + 1}`);
        values.push(updates.description);
    }

    if (values.length === 0) {
        throw new Error('No update fields provided');
    }

    const setClauseStr = setClause.join(', ');
    const updateQuery = `
        UPDATE work_experience
        SET ${setClauseStr}
        WHERE user_id = $${values.length + 1} AND id = $${values.length + 2};
    `;
    values.push(userId, experienceId);

    try {
        await client.query(updateQuery, values);
    } catch (err) {
        console.error(`Error updating work experience ${experienceId}:`, err);
        throw err;
    }
};

export const deleteExperienceUser = async (userId: string, experienceId: string): Promise<void> => {
    const deleteExperienceQuery = `
        DELETE FROM work_experience
        WHERE user_id = $1 AND id = $2;
    `;

    try {
        await client.query(deleteExperienceQuery, [userId, experienceId]);
    } catch (err) {
        console.error(`Error deleting work experience ${experienceId}:`, err);
        throw err;
    }
};
