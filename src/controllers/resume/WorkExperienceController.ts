// controllers/WorkExperienceController.ts
import { Response } from 'express';
import { handleErrors } from '@middlewares';
import {
    createExperienceUser,
    deleteExperienceUser,
    getExperienceUser,
    updateExperienceUser
} from '@services';
import { AuthenticatedRequest } from '@interface';

export class WorkExperienceController {
    async getExperience(req: AuthenticatedRequest, res: Response) {
        try {
            const workExperience = await getExperienceUser(req.userId!);
            res.status(200).json(workExperience);
        } catch (error) {
            handleErrors(res, error, 'The mistake of gaining experience.');
        }
    }

    async createExperience(req: AuthenticatedRequest, res: Response) {
        try {
            const workExperience = await createExperienceUser(req.userId!, req.body);
            res.status(201).json(workExperience);
        } catch (error) {
            handleErrors(res, error, 'Experience Creation Error.');
        }
    }

    async updateExperience(req: AuthenticatedRequest, res: Response) {
        try {
            await updateExperienceUser(req.userId!, req.params.experienceId, req.body);
            res.status(200).json(updateExperienceUser);
        } catch (error) {
            handleErrors(res, error, 'Experience Update Error.');
        }
    }

    async deleteExperience(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteExperienceUser(req.userId!, req.params.experienceId);
            res.status(200).json({ message: 'Experience deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Experience Deletion Error.');
        }
    }
}
