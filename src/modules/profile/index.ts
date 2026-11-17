import type express from 'express';
import { validateProfileConfig } from './module.config.js';
import { registerProfileRoutes } from './http/profile.routes.js';

export { ProfileController } from './http/ProfileController.js';
export {
    deleteUserProfile,
    getUserProfile,
    incrementSpinCount,
    updateSuccessfulResponsesCount,
    updateUserProfile,
} from './application/profileService.js';
export { deriveUserRank } from './domain/deriveUserRank.js';
export { handleAvatarUpload } from './infra/avatarUpload.js';
export { invalidateUserProfileCache, userProfileCache } from './infra/profileCache.js';
export { profileConfig } from './module.config.js';

export function register(app: express.Application): void {
    validateProfileConfig();
    registerProfileRoutes(app);
}
