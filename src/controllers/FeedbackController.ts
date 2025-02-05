// server/controllers/FeedbackController.ts
import {Response} from 'express';
import {handleErrors} from '../server/middlewares.js';
import {
    createChatFeedbackTable,
    deleteChatFeedback,
    deleteFeedbackTable,
    getChatFeedback
} from '../services/feedbackService.js';
import {AuthenticatedRequest} from "../interface/interface";

export class FeedbackController {
    async createFeedbackTable(req: AuthenticatedRequest, res: Response) {
        try {
            await createChatFeedbackTable(req.userId!);
            res.status(201).json(createChatFeedbackTable);
        } catch (error) {
            handleErrors(res, error, 'Error creating Chat Feedback Table.');
        }
    }

    async deleteFeedbackTable(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteFeedbackTable(req.userId!);
            res.status(200).json({message: 'Feedback table deleted successfully.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting feedback table.');
        }
    }

    async getFeedback(req: AuthenticatedRequest, res: Response) {
        try {
            const feedbacks = await getChatFeedback(req.userId!);
            res.status(feedbacks.length ? 200 : 404).json(feedbacks.length ? feedbacks : {message: 'No feedback found.'});
        } catch (error) {
            handleErrors(res, error, 'Error retrieving feedback.');
        }
    }

    async deleteFeedback(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteChatFeedback(req.userId!, req.params.feedbackId);
            res.status(200).json({message: 'Feedback deleted successfully.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting feedback.');
        }
    }
}
