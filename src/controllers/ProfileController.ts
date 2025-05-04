// server/controllers/ProfileController.ts
import { Response } from 'express';
import { AuthenticatedRequest, AvatarUploadParams, UserProfileUpdateFields } from '@interface';
import { handleErrors } from '@middlewares';
import { deleteUserProfile, getUserProfile, updateUserProfile } from '@services';
import { handleAvatarUpload } from '@utils';

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
            const { avatar, ...updateFields }: UserProfileUpdateFields = body;

            if (avatar) {
                const avatarUploadParams: AvatarUploadParams = { avatar, updateFields };
                await handleAvatarUpload(avatarUploadParams.avatar, avatarUploadParams.updateFields);
            }

            await updateUserProfile({ avatar, ...updateFields }, req.userId!);
            res.status(200).json(updateUserProfile);

        } catch (error) {
            handleErrors(res, error, 'Error updating a user profile.');
        }
    }

    async deleteProfile(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteUserProfile(req.userId!);
            res.status(200).json({ message: 'Profile successfully deleted.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting the user profile.');
        }
    }
}
