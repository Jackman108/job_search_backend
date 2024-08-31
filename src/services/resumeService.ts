// resumeService.ts
import client from "../config/dbConfig.js";

export const createResume = async (userId: number, resumeData: {
    full_name: string,
    position?: string,
    employment_type?: string,
    work_schedule?: string,
    travel_time?: string,
    business_trip_readiness?: boolean
}): Promise<number> => {
    const insertResumeQuery = `
            INSERT INTO resumes (user_id, full_name, position, employment_type, work_schedule, travel_time, business_trip_readiness)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        const resumeId = result.rows[0].id;
        console.log(`Resume created with ID ${resumeId}`);
        return resumeId;
    } catch (err) {
        console.error('Error creating resume:', err);
        throw err;
    }
};

export const getResumeById = async (resumeId: number): Promise<any> => {
    const query = `SELECT * FROM resumes WHERE id = $1`;
    try {
        const result = await client.query(query, [resumeId]);
        return result.rows[0] || null;
    } catch (err) {
        console.error(`Error retrieving resume ${resumeId}:`, err);
        throw err;
    }
};

export const updateResume = async (resumeId: number, updates: {
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
        SET ${setClauseStr}, last_updated = CURRENT_TIMESTAMP
        WHERE id = $${values.length + 1};
    `;
    values.push(resumeId);

    try {
        await client.query(updateQuery, values);
        console.log(`Resume with ID ${resumeId} updated successfully.`);
    } catch (err) {
        console.error(`Error updating resume ${resumeId}:`, err);
        throw err;
    }
};

export const deleteResume = async (resumeId: number): Promise<void> => {
    const deleteResumeQuery = `
        DELETE FROM resumes
        WHERE id = $1;
    `;
    const deleteContactsQuery = `
        DELETE FROM contacts
        WHERE resume_id = $1;
    `;
    const deleteWorkExperienceQuery = `
        DELETE FROM work_experience
        WHERE resume_id = $1;
    `;
    const deleteSkillsQuery = `
        DELETE FROM skills
        WHERE resume_id = $1;
    `;

    try {
        await client.query(deleteContactsQuery, [resumeId]);
        await client.query(deleteWorkExperienceQuery, [resumeId]);
        await client.query(deleteSkillsQuery, [resumeId]);
        await client.query(deleteResumeQuery, [resumeId]);
        console.log(`Resume with ID ${resumeId} deleted successfully.`);
    } catch (err) {
        console.error(`Error deleting resume ${resumeId}:`, err);
        throw err;
    }
};
