// workExperienceService.ts
import {executeQuery, generateUpdateQueryWithConditions} from "../../utils/queryHelpers.js";


export const getExperienceUser = async (userId: string): Promise<any[]> => {
    const query = `SELECT * FROM work_experience WHERE user_id = $1`;
    return await executeQuery(query, [userId]);
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

    const query = `
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

    const result = await executeQuery(query, values);
    return result[0].id;
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

    const {query, values} = generateUpdateQueryWithConditions(
        "work_experience",
        updates,
        {user_id: userId, id: experienceId}
    );

    await executeQuery(query, values);
};


export const deleteExperienceUser = async (userId: string, experienceId: string): Promise<void> => {
    const query = `DELETE FROM work_experience WHERE user_id = $1 AND id = $2;`;
    await executeQuery(query, [userId, experienceId]);
};
