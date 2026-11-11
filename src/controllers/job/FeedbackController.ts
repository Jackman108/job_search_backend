// server/controllers/FeedbackController.ts
import { Response } from 'express';
import { deleteChatFeedback, deleteFeedbackTable, getChatFeedback } from '@services';
import { AuthenticatedRequest } from '@interface';
import { handleErrors } from '@middlewares';

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
            // Empty list is a valid resource state — REST 200 + [].
            res.status(200).json(feedbacks);
        } catch (error) {
            handleErrors(res, error, 'Error retrieving feedback.');
        }
    }

    async deleteFeedback(req: AuthenticatedRequest, res: Response) {
        try {
            const feedbackId = Number(req.params.feedbackId);
            if (isNaN(feedbackId)) {
                return res.status(400).json({ message: 'Invalid feedback ID.' });
            }
            await deleteChatFeedback(req.userId!, feedbackId);
            res.status(200).json({ message: 'Feedback deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting feedback.');
        }
    }
}
