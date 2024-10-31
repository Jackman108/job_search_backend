// controllers/ScriptController.js
import { Request, Response } from 'express';
import { personalData } from '../secrets.js';
import { incrementSpinCount, updateSuccessfulResponsesCount } from '../services/resume/profileService.js';
import { sendFeedback } from '../run/sendFeedback.js';
import { stop } from '../utils/stopManager.js';
import { getFeedback } from '../run/getFeedback.js';
import { AuthenticatedRequest, handleErrors } from '../server/middlewares.js';

export class ScriptController {
    async startScript(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password, position, message, vacancyUrl } = req.body;
            if (!req.userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }
            await sendFeedback({
                userId: req.userId,
                email: email || personalData.vacancyEmail,
                password: password || personalData.vacancyPassword,
                position: position || personalData.vacancySearch,
                message: message || personalData.coverLetter,
                vacancyUrl: vacancyUrl || personalData.vacanciesUrl,
            });
            await incrementSpinCount(req.userId);
            await updateSuccessfulResponsesCount(req.userId);
            res.status(200).json({ message: 'The script was executed successfully!' });
        } catch (error) {
            handleErrors(res, error, 'Script execution error.');
        }
    }

    async stopScript(req: AuthenticatedRequest, res: Response) {
        try {
            const { browser } = req.body;
            if (!req.userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }
            await stop(browser);
            res.status(200).json({ message: 'Script stopped successfully!' });
        } catch (error) {
            handleErrors(res, error, 'Script stop error.');
        }
    }

    async refreshData(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password } = req.body;
            if (!req.userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }
            await getFeedback({
                userId: req.userId,
                email: email || personalData.vacancyEmail,
                password: password || personalData.vacancyPassword,
            });
            res.status(200).json({ message: 'The update is up and running!' });
        } catch (error) {
            handleErrors(res, error, 'Error Update!');
        }
    }
}
