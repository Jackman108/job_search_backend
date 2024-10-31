// server/controllers/ResumeController.ts
import { Response } from 'express';
import { AuthenticatedRequest, handleErrors } from '../server/middlewares.js';
import {
    createResumeUser,
    deleteResumeUser,
    getResumeUser,
    updateResumeUser
} from '../services/resume/resumeService.js';


export class ResumeController {
    async createResume(req: AuthenticatedRequest, res: Response) {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            const resume = await createResumeUser(req.userId, req.body);
            res.status(201).json({ message: 'The resume has been successfully created.', resume });
        } catch (error) {
            handleErrors(res, error, 'Error in creating a resume.');
        }
    }

    async getResume(req: AuthenticatedRequest, res: Response) {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            const resume = await getResumeUser(req.userId);
            res.status(resume ? 200 : 404).json(resume || { message: 'No resumes were found.' });
        } catch (error) {
            handleErrors(res, error, 'Summary Receipt Error.');
        }
    }

    async updateResume(req: AuthenticatedRequest, res: Response) {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            await updateResumeUser(req.userId, req.body);
            res.status(200).json({ message: 'The resume has been successfully updated.' });
        } catch (error) {
            handleErrors(res, error, 'Error updating the resume.');
        }
    }

    async deleteResume(req: AuthenticatedRequest, res: Response) {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            await deleteResumeUser(req.userId);
            res.status(200).json({ message: 'The resume has been successfully deleted.' });
        } catch (error) {
            handleErrors(res, error, 'Summary Deletion Error.');
        }
    }
}
