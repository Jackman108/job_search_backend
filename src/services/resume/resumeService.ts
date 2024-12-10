// resumeService.ts
import client from "../../config/dbConfig.js";

export const createResumeUser = async (
    userId: string,
    resumeData: {
        full_name: string,
        position?: string,
        employment_type?: string,
        work_schedule?: string,
        travel_time?: string,
        business_trip_readiness?: boolean
    }): Promise<string> => {
    const insertResumeQuery = `
        INSERT INTO resumes (user_id, full_name, position, employment_type, work_schedule, travel_time, business_trip_readiness, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id;
    `;

    const values = [
        userId,
        resumeData.full_name,
        resumeData.position,
        resumeData.employment_type,
        resumeData.work_schedule,
        resumeData.travel_time,
        resumeData.business_trip_readiness,
    ];

    try {
        const result = await client.query(insertResumeQuery, values);
        return result.rows[0].id;
    } catch (err) {
        console.error('Error creating resume:', err);
        throw err;
    }
};

export const getResumeUser = async (userId: string): Promise<any> => {
    const query = `SELECT * FROM resumes WHERE user_id = $1`;
    try {
        const result = await client.query(query, [userId]);
        return result.rows[0] || null;
    } catch (err) {
        console.error(`Error retrieving resume ${userId}:`, err);
        throw err;
    }
};

export const updateResumeUser = async (userId: string, updates: {
    full_name?: string,
    position?: string,
    employment_type?: string,
    work_schedule?: string,
    travel_time?: string,
    business_trip_readiness?: boolean
}): Promise<void> => {
    const setClause: string[] = [];
    const values: any[] = [];

    if (updates.full_name) {
        setClause.push(`full_name = $${values.length + 1}`);
        values.push(updates.full_name);
    }
    if (updates.position) {
        setClause.push(`position = $${values.length + 1}`);
        values.push(updates.position);
    }
    if (updates.employment_type) {
        setClause.push(`employment_type = $${values.length + 1}`);
        values.push(updates.employment_type);
    }
    if (updates.work_schedule) {
        setClause.push(`work_schedule = $${values.length + 1}`);
        values.push(updates.work_schedule);
    }
    if (updates.travel_time) {
        setClause.push(`travel_time = $${values.length + 1}`);
        values.push(updates.travel_time);
    }
    if (updates.business_trip_readiness !== undefined) {
        setClause.push(`business_trip_readiness = $${values.length + 1}`);
        values.push(updates.business_trip_readiness);
    }

    if (values.length === 0) {
        throw new Error('No update fields provided');
    }

    const setClauseStr = setClause.join(', ');
    const updateQuery = `
        UPDATE resumes
        SET ${setClauseStr}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${values.length + 1};
    `;
    values.push(userId);

    try {
        await client.query(updateQuery, values);
    } catch (err) {
        console.error(`Error updating resume ${userId}:`, err);
        throw err;
    }
};

export const deleteResumeUser = async (userId: string): Promise<void> => {
    const deleteResumeQuery = `
        DELETE FROM resumes
        WHERE user_id = $1;
    `;

    try {
        await client.query(deleteResumeQuery, [userId]);
    } catch (err) {
        console.error(`Error deleting resume ${userId}:`, err);
        throw err;
    }
};
