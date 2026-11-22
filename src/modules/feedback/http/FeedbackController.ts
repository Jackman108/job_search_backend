import { Response } from 'express';
import { handleErrors } from '@middlewares';
import type { AuthenticatedRequest } from '../../../interface/index.js';
import { deleteChatFeedback, deleteFeedbackTable, getChatFeedback } from '../application/feedbackService.js';

export class FeedbackController {
    async deleteFeedbackTable(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteFeedbackTable(req.userId!);
            res.status(200).json({ message: 'Feedback table deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting feedback table.');
        }
    }

    async getFeedback(req: AuthenticatedRequest, res: Response) {
        try {
            const feedbacks = await getChatFeedback(req.userId!);
            res.status(200).json(feedbacks);
        } catch (error) {
            handleErrors(res, error, 'Error retrieving feedback.');
        }
    }

    async deleteFeedback(req: AuthenticatedRequest, res: Response) {
        try {
            const feedbackId = Number(req.params.feedbackId);
            if (isNaN(feedbackId)) {
                res.status(400).json({ message: 'Invalid feedback ID.' });
                return;
            }
            await deleteChatFeedback(req.userId!, feedbackId);
            res.status(200).json({ message: 'Feedback deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting feedback.');
        }
    }
}
