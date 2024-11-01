// server/controllers/ChatFeedbackController.ts
import { Response } from 'express';
import { AuthenticatedRequest, handleErrors } from '../server/middlewares.js';
import {
    createChatFeedbackTable,
    deleteChatFeedback,
    getChatFeedback,
    saveChatFeedback
} from '../services/chatService.js';

export class ChatFeedbackController {
    async createFeedbackTable(req: AuthenticatedRequest, res: Response) {
        const userId = req.body.userId;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            await createChatFeedbackTable(userId);
            res.status(201).json({ message: 'Chat Feedback Table successfully created.' });
        } catch (error) {
            handleErrors(res, error, 'Error creating Chat Feedback Table.');
        }
    }

    async saveFeedback(req: AuthenticatedRequest, res: Response) {
        const { userId } = req;
        const data = req.body;
        if (!userId || !data) {
            return res.status(400).json({ message: 'userId and feedback data are required.' });
        }
        try {
            await saveChatFeedback(data, userId);
            res.status(201).json({ message: 'Feedback successfully saved.' });
        } catch (error) {
            handleErrors(res, error, 'Error saving feedback.');
        }
    }

    async getFeedback(req: AuthenticatedRequest, res: Response) {
        const { userId } = req;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            const feedbacks = await getChatFeedback(userId);
            res.status(feedbacks.length ? 200 : 404).json(feedbacks.length ? feedbacks : { message: 'No feedback found.' });
        } catch (error) {
            handleErrors(res, error, 'Error retrieving feedback.');
        }
    }

    async deleteFeedback(req: AuthenticatedRequest, res: Response) {
        const { userId } = req;
        const { feedbackId } = req.params;

        if (!userId || !feedbackId) {
            return res.status(400).json({ message: 'userId and feedbackId are required.' });
        }
        try {
            await deleteChatFeedback(feedbackId, userId);
            res.status(200).json({ message: 'Feedback deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting feedback.');
        }
    }
}
