// server/controllers/ResumeController.ts
import { Response } from 'express';
import { handleErrors } from '../../middlewares/index.js';
import {
    createResumeUser,
    deleteResumeUser,
    getResumeUser,
    updateResumeUser
} from '../../services/resume/resumeService.js';
import { AuthenticatedRequest } from "../../interface/index.js";

export class ResumeController {
    async getResume(req: AuthenticatedRequest, res: Response) {
        try {
            const resume = await getResumeUser(req.userId!);
            res.status(200).json(resume);
        } catch (error) {
            handleErrors(res, error, 'Summary Receipt Error.');
        }
    }

    async createResume(req: AuthenticatedRequest, res: Response) {
        try {
            const resume = await createResumeUser(req.userId!, req.body);
            res.status(201).json(resume);
        } catch (error) {
            handleErrors(res, error, 'Error in creating a resume.');
        }
    }

    async updateResume(req: AuthenticatedRequest, res: Response) {
        try {
            await updateResumeUser(req.userId!, req.body);
            res.status(200).json(updateResumeUser);
        } catch (error) {
            handleErrors(res, error, 'Error updating the resume.');
        }
    }

    async deleteResume(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteResumeUser(req.userId!);
            res.status(200).json({ message: 'The resume has been successfully deleted.' });
        } catch (error) {
            handleErrors(res, error, 'Summary Deletion Error.');
        }
    }
}
