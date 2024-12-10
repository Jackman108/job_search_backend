import {Response} from 'express';
import {handleErrors} from '../server/middlewares.js';
import {
    createSubscription,
    createTableSubscriptions,
    deleteSubscription,
    getSubscription,
    listSubscription,
    updateSubscription
} from '../services/subscriptionsService.js';
import {AuthenticatedRequest} from "../interface/interface";

type SubscriptionType = 'daily' | 'weekly' | 'monthly';

export class SubscriptionController {
    private getSubscriptionDetails(subscriptionType: SubscriptionType) {
        const prices: { [key in SubscriptionType]: number } = {
            daily: 3,
            weekly: 15,
            monthly: 50,
        };
        const price = prices[subscriptionType];

        if (!price) {
            throw new Error('Invalid subscription type');
        }

        const endDate = new Date();
        if (subscriptionType === 'daily') endDate.setDate(endDate.getDate() + 1);
        if (subscriptionType === 'weekly') endDate.setDate(endDate.getDate() + 7);
        if (subscriptionType === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        return {price, endDate};
    }

    async createSubscriptionTable(req: AuthenticatedRequest, res: Response,) {
        try {
            await createTableSubscriptions();
            res.status(201).json({message: 'Subscription Table successfully created.'});
        } catch (error) {
            handleErrors(res, error, 'Error creating a Subscription Table.');
        }
    }

    async listSubscriptions(req: AuthenticatedRequest, res: Response) {
        try {
            const subscriptions = await listSubscription(req.userId!);
            res.status(subscriptions.length ? 200 : 404).json(subscriptions.length ? subscriptions : {message: 'subscriptions not found.'});
        } catch (error) {
            handleErrors(res, error, 'Error fetching subscriptions.');
        }
    }


    async getSubscription(req: AuthenticatedRequest, res: Response,) {
        try {
            const subscription = await getSubscription(req.params.id);
            res.status(200).json(subscription);
        } catch (error) {
            handleErrors(res, error, 'Error creating subscription');
        }
    };

    async createSubscription(req: AuthenticatedRequest, res: Response,) {
        const {subscriptionType}: { subscriptionType: SubscriptionType } = req.body;
        try {
            const {price, endDate} = this.getSubscriptionDetails(subscriptionType);

            const subscription = await createSubscription({
                userId: req.userId!,
                subscriptionType,
                price,
                startDate: new Date().toISOString(),
                endDate: endDate.toISOString(),
            });

            res.status(201).json(subscription);
        } catch (error) {
            handleErrors(res, error, 'Error creating subscription');
        }
    };

    async updateSubscription(req: AuthenticatedRequest, res: Response) {
        const {subscriptionType}: { subscriptionType: SubscriptionType } = req.body;
        try {
            const {price, endDate} = this.getSubscriptionDetails(subscriptionType);

            const updatedSubscription = await updateSubscription({
                userId: req.userId!,
                subscriptionType,
                price,
                startDate: new Date().toISOString(),
                endDate: endDate.toISOString(),
            });

            res.status(200).json(updatedSubscription);
        } catch (error) {
            handleErrors(res, error, 'Error updating subscription');
        }
    }

    async deleteSubscription(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteSubscription(req.params.id);
            res.status(200).json({message: 'Profile successfully deleted.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting the user profile.');
        }
    }
}