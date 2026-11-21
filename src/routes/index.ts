import express from 'express';
import { register as registerFeedback } from '../modules/feedback/index.js';
import { register as registerHhJobs } from '../modules/hh-jobs/index.js';
import { register as registerNotifications } from '../modules/notifications/index.js';
import { register as registerPayments } from '../modules/payments/index.js';
import { register as registerProfile } from '../modules/profile/index.js';
import { register as registerResume } from '../modules/resume/index.js';
import { register as registerSearchProfile } from '../modules/search-profile/index.js';
import { register as registerSubscriptions } from '../modules/subscriptions/index.js';
import { register as registerVacancies } from '../modules/vacancies/index.js';
import { swaggerRouter } from './swagger.js';

/** Mount all domain modules + OpenAPI. Legacy `routes/*.routes.ts` shims removed (Phase 8b). */
export const initializeRoutes = (app: express.Application) => {
    app.use('/api-docs', swaggerRouter);

    registerProfile(app);
    registerNotifications(app);
    registerSearchProfile(app);
    registerVacancies(app);
    registerFeedback(app);
    registerResume(app);
    registerSubscriptions(app);
    registerPayments(app);
    registerHhJobs(app);
};
