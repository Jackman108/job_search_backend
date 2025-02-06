// server/controllers/ProfileController.ts
import {Response} from 'express';
import {AuthenticatedRequest, AvatarUploadParams, UserProfileUpdateFields} from '../interface/interface.js';
import {handleErrors} from '../server/middlewares.js';
import {deleteUserProfile, getUserProfile, updateUserProfile} from '../services/profileService.js';
import {handleAvatarUpload} from '../utils/avatarUpload.js';

export class ProfileController {
    async getProfile(req: AuthenticatedRequest, res: Response) {
        try {
            const profile = await getUserProfile(req.userId!);
            res.status(200).json(profile);
        } catch (error) {
            handleErrors(res, error, 'Error fetching profile.');
        }
    }

    async updateProfile(req: AuthenticatedRequest, res: Response) {
        try {
            const body = req.body ?? {};
            const {avatar, ...updateFields}: UserProfileUpdateFields = body;

            if (avatar) {
                const avatarUploadParams: AvatarUploadParams = {avatar, updateFields};
                await handleAvatarUpload(avatarUploadParams.avatar, avatarUploadParams.updateFields);
            }

            const updatedProfile = await updateUserProfile({...updateFields, userId: req.userId!});
            res.status(200).json(updatedProfile);
        } catch (error) {
            handleErrors(res, error, 'Error updating a user profile.');
        }
    }

    async deleteProfile(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteUserProfile(req.userId!);
            res.status(200).json({message: 'Profile successfully deleted.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting the user profile.');
        }
    }
}
