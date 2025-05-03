import { CreateSkillInput, Skill, UpdateSkillInput } from "../../interface/index.js";
import { executeQuery, generateUpdateQueryWithConditions } from "../../utils/queryHelpers.js";
import { getResumeByUserId } from "../../utils/getResumeByUserId.js";


export const createSkillUser = async (
    userId: string,
    skillData: CreateSkillInput
): Promise<string> => {
    const resumeId = await getResumeByUserId(userId);
    if (!resumeId) {
        throw new Error("Навык не создан. Возможно, у пользователя нет резюме.");
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


export const getSkillsUser = async (userId: string): Promise<Skill[]> => {
    const resumeId = await getResumeByUserId(userId);
    const query = `SELECT * FROM skills WHERE resume_id = $1`;

    return await executeQuery(query, [resumeId]);
};


export const updateSkillUser = async (
    userId: string,
    skillId: string,
    updates: UpdateSkillInput
): Promise<void> => {
    const resumeId = await getResumeByUserId(userId);

    const { query, values } = generateUpdateQueryWithConditions(
        "skills",
        updates,
        { resume_id: resumeId, id: skillId }
    );

    await executeQuery(query, values);
};


export const deleteSkillUser = async (userId: string, skillId: string): Promise<void> => {
    const resumeId = await getResumeByUserId(userId);
    const query = `DELETE FROM skills WHERE resume_id = $1 AND id = $2;`;

    await executeQuery(query, [resumeId, skillId]);
};
