import { executeQuery } from '../../../utils/queryHelpers.js';

export const getResumeByUserId = async (userId: string): Promise<string | null> => {
    const query = 'SELECT id FROM resumes WHERE user_id = $1 LIMIT 1;';
    const result = await executeQuery(query, [userId]);
    return result[0]?.id || null;
};
