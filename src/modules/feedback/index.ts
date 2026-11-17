import type express from 'express';
import { validateFeedbackConfig } from './module.config.js';
import { registerFeedbackRoutes } from './http/feedback.routes.js';

export { FeedbackController } from './http/FeedbackController.js';
export {
    createChatFeedbackTable,
    deleteChatFeedback,
    deleteFeedbackTable,
    getChatFeedback,
    saveChatFeedback,
} from './application/feedbackService.js';
export { feedbackConfig, feedbackTableIdent } from './module.config.js';

export function register(app: express.Application): void {
    validateFeedbackConfig();
    registerFeedbackRoutes(app);
}
