// server/controllers/ProfileController.ts
import { Response } from 'express';
import { AvatarUploadParams, UserProfileUpdateFields } from '../interface/interface.js';
import { AuthenticatedRequest } from '../server/middlewares.js';
import { createUserProfile, getUserProfile, updateUserProfile } from '../services/resume/profileService.js';
import { createVacancyTable } from '../services/sentFeedbackService.js';
import { handleAvatarUpload } from '../utils/avatarUpload.js';

export class ProfileController {

    async getProfile(req: AuthenticatedRequest, res: Response) {
        const { userId } = req;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            const profile = await getUserProfile(userId);
            if (!profile) {
                return res.status(404).json({ message: 'Profile not found' });
            }
            res.status(200).json(profile);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching profile.' });
        }
    }
    async createProfile(req: AuthenticatedRequest, res: Response) {
        const { userId } = req;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            const profileData = { ...req.body, userId };
            await createUserProfile(profileData);
            await createVacancyTable(profileData);
            res.status(201).json({ message: 'Profile successfully created.' });
        } catch (error) {
            res.status(500).json({ message: 'Error creating a user profile.' });
        }
    }


    async updateProfile(req: AuthenticatedRequest, res: Response) {
        const { userId } = req;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            const body = req.body ?? {};

            const { avatar, ...updateFields }: UserProfileUpdateFields = body;
            if (avatar) {
                const avatarUploadParams: AvatarUploadParams = { avatar, updateFields };
                await handleAvatarUpload(avatarUploadParams.avatar, avatarUploadParams.updateFields);
            }
            const updatedProfile = await updateUserProfile({ ...updateFields, userId: req.userId });
            res.status(200).json({ message: 'The profile has been successfully updated.', profile: updatedProfile });
        } catch (error) {
            res.status(500).json({ message: 'Error updating a user profile.' });
        }
    }
}
