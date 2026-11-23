import { executeQuery } from '../../../platform/db/index.js';

const resumeIdCache = new Map<string, string | null>();

export const getResumeIdCacheByUserId = async (userId: string | number): Promise<string | null> => {
    const key = userId.toString();
    if (resumeIdCache.has(key)) {
        return resumeIdCache.get(key) || null;
    }

    const query = 'SELECT id FROM resumes WHERE user_id = $1 LIMIT 1;';
    const result = await executeQuery(query, [userId]);
    const resumeId = result[0]?.id || null;

    resumeIdCache.set(key, resumeId);
    return resumeId;
};

export const invalidateResumeIdCache = async (userId: string): Promise<void> => {
    resumeIdCache.delete(userId);
};
