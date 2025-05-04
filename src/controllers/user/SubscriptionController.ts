import { Response } from 'express';
import { handleErrors, handleSuccess } from '@middlewares';
import {
    createSubscription,
    deleteSubscription,
    getActiveSubscription,
    getSubscription,
    updateSubscription
} from '@services';
import { AuthenticatedRequest, SubscriptionRequestBody } from '@interface';

export class SubscriptionController {

    async listSubscriptions(req: AuthenticatedRequest, res: Response) {
        try {
            const subscriptions = await getActiveSubscription(req.userId!);
            res.status(200).json(subscriptions);
        } catch (error) {
            handleErrors(res, error, 'Error fetching subscriptions.');
        }
    }


    async getSubscription(req: AuthenticatedRequest, res: Response,) {
        try {
            const subscription = await getSubscription(req.userId!, req.params.id);
            res.status(200).json(subscription);
        } catch (error) {
            handleErrors(res, error, 'Error fetching subscription');
        }
    };

    async createSubscription(req: AuthenticatedRequest, res: Response,) {
        const { subscription_type, start_date }: SubscriptionRequestBody = req.body;
        try {
            const createdSubscription = await createSubscription({
                user_id: req.userId!,
                subscription_type,
                start_date,
            });
            handleSuccess(res, 'Subscription successfully creating.', createdSubscription);
        } catch (error) {
            handleErrors(res, error, 'Error creating subscription');
        }
    };


    async updateSubscription(req: AuthenticatedRequest, res: Response) {
        const { subscription_type }: SubscriptionRequestBody = req.body;
        try {

            await updateSubscription(req.userId!, req.params.id, {
                subscription_type
            });
            handleSuccess(res, 'Subscription successfully updating.');
        } catch (error) {
            handleErrors(res, error, 'Error updating subscription');
        }
    }

    async deleteSubscription(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteSubscription(req.userId!, req.params.id);
            handleSuccess(res, 'Subscription successfully deleted.');
        } catch (error) {
            handleErrors(res, error, 'Error deleting the subscription.');
        }
    }
}