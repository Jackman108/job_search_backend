import type { ProfileData } from '@interface';

export const userProfileCache = new Map<string, ProfileData>();

export const invalidateUserProfileCache = (userId: string) => {
    userProfileCache.delete(userId.toString());
};
