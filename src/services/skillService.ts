// skillService.ts
import client from "../config/dbConfig.js";

export const createSkill = async (
    userId: string,
    skillData: {
        skill_name: string;
        proficiency_level?: string
    }): Promise<string> => {
    const insertSkillQuery = `
        INSERT INTO skills (user_id, skill_name, proficiency_level)
        VALUES ($1, $2, $3)
        RETURNING id;
    `;

    const values = [
        userId,
        skillData.skill_name,
        skillData.proficiency_level,
    ];

    try {
        const result = await client.query(insertSkillQuery, values);
        const skillId = result.rows[0].id;
        console.log(`Skill created with ID ${skillId}`);
        return skillId;
    } catch (err) {
        console.error('Error creating skill:', err);
        throw err;
    }
};

export const getSkillsByUserId = async (userId: string): Promise<any[]> => {
    const query = `SELECT * FROM skills WHERE user_id = $1`;
    try {
        const result = await client.query(query, [userId]);
        return result.rows;
    } catch (err) {
        console.error(`Error retrieving skills for user ${userId}:`, err);
        throw err;
    }
};

export const updateSkill = async (
    userId: string,
    skillId: string,
    updates: { skill_name?: string; proficiency_level?: string }
): Promise<void> => {
    const setClause: string[] = [];
    const values: any[] = [];

    if (updates.skill_name) {
        setClause.push(`skill_name = $${values.length + 1}`);
        values.push(updates.skill_name);
    }
    if (updates.proficiency_level) {
        setClause.push(`proficiency_level = $${values.length + 1}`);
        values.push(updates.proficiency_level);
    }

    if (values.length === 0) {
        throw new Error('No update fields provided');
    }

    const setClauseStr = setClause.join(', ');
    const updateQuery = `
        UPDATE skills
        SET ${setClauseStr}
        WHERE user_id = $${values.length + 1} AND id = $${values.length + 2};
    `;
    values.push(userId, skillId);

    try {
        await client.query(updateQuery, values);
        console.log(`Skill with ID ${skillId} updated successfully for user ${userId}.`);
    } catch (err) {
        console.error(`Error updating skill ${skillId}:`, err);
        throw err;
    }
};

export const deleteSkill = async (userId: string, skillId: string): Promise<void> => {
    const deleteSkillQuery = `
        DELETE FROM skills
        WHERE user_id = $1 AND id = $2;
    `;

    try {
        await client.query(deleteSkillQuery, [userId, skillId]);
        console.log(`Навык с ID ${skillId} успешно удален для пользователя ${userId}.`);
    } catch (err) {
        console.error(`Ошибка при удалении навыка ${skillId}:`, err);
        throw err;
    }
};
