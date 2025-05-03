import { ProfileData } from "../interface/index.js";
import { executeQuery } from "./queryHelpers.js";

const resumeIdCache = new Map<string, string | null>();

export const getResumeIdCacheByUserId = async (userId: string | number): Promise<string | null> => {
    if (resumeIdCache.has(userId.toString())) {
        return resumeIdCache.get(userId.toString()) || null;
    }

    const query = "SELECT id FROM resumes WHERE user_id = $1 LIMIT 1;";
    const result = await executeQuery(query, [userId]);
    const resumeId = result[0]?.id || null;

    resumeIdCache.set(userId.toString(), resumeId);
    return resumeId;
};


export const invalidateResumeIdCache = async (userId: string): Promise<void> => {
    resumeIdCache.delete(userId);
};


export const userProfileCache = new Map<string, ProfileData>();


export const invalidateUserProfileCache = (userId: string) => {
    userProfileCache.delete(userId.toString());
}