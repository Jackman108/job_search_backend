// skillService.ts
import {executeQuery, generateUpdateQueryWithConditions} from "../../utils/queryHelpers.js";
import {getResumeIdCacheByUserId, invalidateResumeIdCache} from "../../utils/cacheQueryHelpers.js";


export const createSkillUser = async (
    userId: string,
    skillData: {
        skill_name: string;
        proficiency_level: string
    }
): Promise<string> => {
    const resumeId = await getResumeIdCacheByUserId(userId);
    if (!resumeId) {
        throw new Error("Контакт не создан. Возможно, у пользователя нет резюме.");
    }
    const query = `
        INSERT INTO skills (resume_id, skill_name, proficiency_level)
        VALUES ($1, $2, $3) RETURNING id;
        `;

    const values = [
        resumeId,
        skillData.skill_name,
        skillData.proficiency_level,
    ];

    const result = await executeQuery(query, values);
    return result[0]?.id;
};


export const getSkillsUser = async (userId: string): Promise<any[]> => {
    const resumeId = await getResumeIdCacheByUserId(userId);
    const query = `SELECT * FROM skills WHERE resume_id = $1`;

    return await executeQuery(query, [resumeId]);
};


export const updateSkillUser = async (
    userId: string,
    skillId: string,
    updates: { resume_id: string; skill_name: string; proficiency_level: string }
): Promise<void> => {
        const {query, values} = generateUpdateQueryWithConditions(
        "skills",
        updates,
        {resume_id: updates.resume_id, id: skillId}
    );

    await executeQuery(query, values);
    await invalidateResumeIdCache(userId);
};


export const deleteSkillUser = async (userId: string, skillId: string): Promise<void> => {
    const resumeId = await getResumeIdCacheByUserId(userId);
    const query = `DELETE FROM skills WHERE resume_id = $1 AND id = $2;`;

    await executeQuery(query, [resumeId, skillId]);
    await invalidateResumeIdCache(userId);
};
