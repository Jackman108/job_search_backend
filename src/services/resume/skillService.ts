// skillService.ts
import {executeQuery, generateUpdateQueryWithConditions} from "../../utils/queryHelpers.js";


export const createSkillUser = async (
    userId: string,
    skillData: {
        skill_name: string;
        proficiency_level?: string
    }
): Promise<string> => {

    const query = `
        INSERT INTO skills (user_id, skill_name, proficiency_level)
        VALUES ($1, $2, $3)
        RETURNING id;
    `;

    const values = [
        userId,
        skillData.skill_name,
        skillData.proficiency_level,
    ];

    const result = await executeQuery(query, values);
    return result[0]?.id;
};


export const getSkillsUser = async (userId: string): Promise<any[]> => {
    const query = `SELECT * FROM skills WHERE user_id = $1`;
    return await executeQuery(query, [userId]);
};


export const updateSkillUser = async (
    userId: string,
    skillId: string,
    updates: { skill_name?: string; proficiency_level?: string }
): Promise<void> => {

    const {query, values} = generateUpdateQueryWithConditions(
        "skills",
        updates,
        {user_id: userId, id: skillId}
    );

    await executeQuery(query, values);
};


export const deleteSkillUser = async (userId: string, skillId: string): Promise<void> => {
    const query = `DELETE FROM skills WHERE user_id = $1 AND id = $2;`;
    await executeQuery(query, [userId, skillId]);
};
