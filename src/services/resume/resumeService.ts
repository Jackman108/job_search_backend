// resumeService.ts
import {executeQuery, generateUpdateQuery} from "../../utils/queryHelpers.js";


export const createResumeUser = async (
    userId: string,
    resumeData: {
        full_name: string,
        position?: string,
        employment_type?: string,
        work_schedule?: string,
        travel_time?: string,
        business_trip_readiness: boolean
    }
): Promise<string> => {

    const query = `
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

    const result = await executeQuery(query, values);
    return result[0].id;
};


export const getResumeUser = async (userId: string): Promise<any> => {
    const query = `SELECT * FROM resumes WHERE user_id = $1 LIMIT 1`;
    const result = await executeQuery(query, [userId]);
    return result[0] || null;
};


export const updateResumeUser = async (userId: string, updates: {
    full_name: string,
    position?: string,
    employment_type?: string,
    work_schedule?: string,
    travel_time?: string,
    business_trip_readiness?: boolean
}): Promise<void> => {
    const {query, values} = generateUpdateQuery("resumes", updates, "user_id", userId);
    await executeQuery(query, values);
};


export const deleteResumeUser = async (userId: string): Promise<void> => {
    const query = ` DELETE FROM resumes WHERE user_id = $1; `;
    await executeQuery(query, [userId]);
};
