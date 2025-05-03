import { Response } from 'express';
import { createSkillUser, deleteSkillUser, getSkillsUser, updateSkillUser } from '../../services/resume/skillService.js';
import { handleErrors } from '../../middlewares/index.js';
import { AuthenticatedRequest } from "../../interface/index.js";

export class SkillsController {
    async getSkills(req: AuthenticatedRequest, res: Response) {
        try {
            const skills = await getSkillsUser(req.userId!);
            res.status(200).json(skills);
        } catch (error) {
            handleErrors(res, error, 'Error retrieving skills.');
        }
    }

    async createSkill(req: AuthenticatedRequest, res: Response) {
        try {
            const newSkill = await createSkillUser(req.userId!, req.body);
            res.status(201).json(newSkill);
        } catch (error) {
            handleErrors(res, error, 'Error creating skill.');
        }
    }

    async updateSkill(req: AuthenticatedRequest, res: Response) {
        try {
            await updateSkillUser(req.userId!, req.params.skillId, req.body);
            res.status(200).json(updateSkillUser);
        } catch (error) {
            handleErrors(res, error, 'Error deleting skill.');
        }
    }

    async deleteSkill(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteSkillUser(req.userId!, req.params.skillId);
            res.status(200).json({ message: 'Skill deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting skill.');
        }
    }
}
