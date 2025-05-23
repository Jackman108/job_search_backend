// controllers/ScriptController.js
import { Response } from 'express';
import { getFeedback } from '@run';
import { sendFeedback } from '@run';
import { handleErrors } from '@middlewares';
import { incrementSpinCount, updateSuccessfulResponsesCount } from '@services';
import { stop } from '@utils';
import { AuthenticatedRequest } from '@interface';
import { personalData } from 'src/secrets';

export class ScriptController {
    async startScript(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password, position, message, vacancyUrl } = req.body;

            await sendFeedback({
                userId: req.userId!,
                email: email || personalData.vacancyEmail,
                password: password || personalData.vacancyPassword,
                position: position || personalData.vacancySearch,
                message: message || personalData.coverLetter,
                vacancyUrl: vacancyUrl || personalData.vacanciesUrl,
            });

            await incrementSpinCount(req.userId!);
            await updateSuccessfulResponsesCount(req.userId!);

            res.status(200).json({ message: 'The script was executed successfully!' });
        } catch (error) {
            handleErrors(res, error, 'Script execution error.');
        }
    }

    async stopScript(req: AuthenticatedRequest, res: Response) {
        try {
            await stop(req.body.browser);
            res.status(200).json({ message: 'Script stopped successfully!' });
        } catch (error) {
            handleErrors(res, error, 'Script stop error.');
        }
    }

    async refreshData(req: AuthenticatedRequest, res: Response) {
        try {
            const { email, password } = req.body;

            await getFeedback({
                userId: req.userId!,
                email: email || personalData.vacancyEmail,
                password: password || personalData.vacancyPassword,
            });

            res.status(200).json({ message: 'The update is up and running!' });
        } catch (error) {
            handleErrors(res, error, 'Error Update!');
        }
    }
}
