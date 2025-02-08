// workExperienceService.ts
import {executeQuery, generateUpdateQueryWithConditions} from "../../utils/queryHelpers.js";
import {getResumeIdCacheByUserId, invalidateResumeIdCache} from "../../utils/cacheQueryHelpers.js";


export const getExperienceUser = async (userId: string): Promise<any[]> => {

    const resumeId = await getResumeIdCacheByUserId(userId);
    const query = `SELECT * FROM work_experience WHERE resume_id = $1`;
    return await executeQuery(query, [resumeId]);
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
    const resumeId = await getResumeIdCacheByUserId(userId);
    if (!resumeId) {
        throw new Error("Контакт не создан. Возможно, у пользователя нет резюме.");
    }
    const query = `
        INSERT INTO work_experience (resume_id, company_name, position, start_date, end_date, description)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`;

    const values = [
        resumeId,
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
        resume_id: string;
        company_name: string;
        position: string;
        start_date: Date;
        end_date: Date;
        description?: string;
    }
): Promise<void> => {
        const {query, values} = generateUpdateQueryWithConditions(
        "work_experience",
        updates,
        {resume_id: updates.resume_id, id: experienceId}
    );

    await executeQuery(query, values);
    await invalidateResumeIdCache(userId);
};


export const deleteExperienceUser = async (userId: string, experienceId: string): Promise<void> => {
    const resumeId = await getResumeIdCacheByUserId(userId);
    const query = `DELETE FROM work_experience WHERE resume_id = $1 AND id = $2;`;

    await executeQuery(query, [resumeId, experienceId]);
    await invalidateResumeIdCache(userId);
};
