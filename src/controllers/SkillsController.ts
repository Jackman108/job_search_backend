// server/controllers/SkillsController.ts
import { Response } from 'express';
import { createSkillUser, deleteSkillUser, getSkillsUser, updateSkillUser } from '../services/resume/skillService.js';
import { AuthenticatedRequest, handleErrors } from '../server/middlewares.js';


export class SkillsController {
    async getSkills(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }

            const skills = await getSkillsUser(userId);
            res.status(skills.length ? 200 : 404).json(skills.length ? skills : { message: 'No skills found.' });
        } catch (error) {
            handleErrors(res, error, 'Error retrieving skills.');
        }
    }

    async createSkill(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            const skillData = req.body;
            if (!userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }

            const newSkill = await createSkillUser(userId, skillData);
            res.status(201).json(newSkill);
        } catch (error) {
            handleErrors(res, error, 'Error creating skill.');
        }
    }

    async updateSkill(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            const { skillId } = req.params;
            if (!userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }

            await updateSkillUser(userId, skillId, req.body);
            res.status(200).json({ message: 'Skill deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting skill.');
        }
    }
    async deleteSkill(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            const { skillId } = req.params;
            if (!userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }

            await deleteSkillUser(skillId, userId);
            res.status(200).json({ message: 'Skill deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting skill.');
        }
    }
}
