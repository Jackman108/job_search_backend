// server/controllers/ProfileController.ts
import {Response} from 'express';
import {AvatarUploadParams, UserProfileUpdateFields} from '../interface/interface.js';
import {AuthenticatedRequest, handleErrors} from '../server/middlewares.js';
import {createUserProfile, deleteUserProfile, getUserProfile, updateUserProfile} from '../services/profileService.js';
import {handleAvatarUpload} from '../utils/avatarUpload.js';

export class ProfileController {

    async getProfile(req: AuthenticatedRequest, res: Response) {
        const {userId} = req;
        if (!userId) {
            return res.status(400).json({message: 'userId is required.'});
        }
        try {
            const profile = await getUserProfile(userId);
            if (!profile) {
                throw new Error('Profile not created');
            } else if (Object.keys(profile).length === 0) {
                console.warn('Profile is empty');
                return res.status(204).json({message: 'Profile is empty'});
            }
            res.status(200).json(profile);
        } catch (error) {
            console.error('Error fetching profile:', error instanceof Error ? error.message : error);
            if (error instanceof Error && error.message === 'Profile not created') {
                handleErrors(res, error, 'Profile not created');
            } else {
                handleErrors(res, error, 'Error fetching profile.');
            }
        }
    }

    async createProfile(req: AuthenticatedRequest, res: Response) {
        const userId = req.body.userId;
        if (!userId) {
            return res.status(400).json({message: 'userId is required.'});
        }
        try {
            await createUserProfile(userId);
            res.status(201).json({message: 'Profile successfully created.'});
        } catch (error) {
            handleErrors(res, error, 'Error creating a user profile.');
        }
    }

    async updateProfile(req: AuthenticatedRequest, res: Response) {
        const {userId} = req;
        if (!userId) {
            return res.status(400).json({message: 'userId is required.'});
        }
        try {
            const body = req.body ?? {};

            const {avatar, ...updateFields}: UserProfileUpdateFields = body;
            if (avatar) {
                const avatarUploadParams: AvatarUploadParams = {avatar, updateFields};
                await handleAvatarUpload(avatarUploadParams.avatar, avatarUploadParams.updateFields);
            }
            const updatedProfile = await updateUserProfile({...updateFields, userId: req.userId});
            res.status(200).json({message: 'The profile has been successfully updated.', profile: updatedProfile});
        } catch (error) {
            handleErrors(res, error, 'Error updating a user profile.');
        }
    }

    async deleteProfile(req: AuthenticatedRequest, res: Response) {
        const {userId} = req;
        if (!userId) {
            return res.status(400).json({message: 'userId is required.'});
        }
        try {
            await deleteUserProfile(userId);
            res.status(200).json({message: 'Profile successfully deleted.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting the user profile.');
        }
    }
}
