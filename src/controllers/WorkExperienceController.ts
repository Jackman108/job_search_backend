// controllers/WorkExperienceController.ts
import { Response } from 'express';
import { AuthenticatedRequest, handleErrors } from '../server/middlewares.js';
import { createExperienceUser, deleteExperienceUser, getExperienceUser, updateExperienceUser } from '../services/resume/workExperienceService.js';

export class WorkExperienceController {
    async getExperience(req: AuthenticatedRequest, res: Response) {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            const workExperience = await getExperienceUser(req.userId);
            res.status(workExperience.length ? 200 : 404).json(workExperience.length ? workExperience : { message: 'Experiments not found.' });
        } catch (error) {
            handleErrors(res, error, 'The mistake of gaining experience.');
        }
    }

    async createExperience(req: AuthenticatedRequest, res: Response) {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            const workExperience = await createExperienceUser(req.userId, req.body);
            res.status(201).json({ message: 'The experience has been successfully created.', workExperience });
        } catch (error) {
            handleErrors(res, error, 'Experience Creation Error.');
        }
    }

    async updateExperience(req: AuthenticatedRequest, res: Response) {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            await updateExperienceUser(req.userId, req.params.experienceId, req.body);
            res.status(200).json({ message: 'The experience has been successfully updated.' });
        } catch (error) {
            handleErrors(res, error, 'Experience Update Error.');
        }
    }

    async deleteExperience(req: AuthenticatedRequest, res: Response) {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            await deleteExperienceUser(req.userId, req.params.experienceId);
            res.status(200).json({ message: 'Опыт успешно удален.' });
        } catch (error) {
            handleErrors(res, error, 'Experience Deletion Error.');
        }
    }
}
