import express from 'express';
import { register as registerVacancies } from '../modules/vacancies/index.js';
import { register as registerFeedback } from '../modules/feedback/index.js';

/** @deprecated Prefer `modules/vacancies.register` + `modules/feedback.register`. */
export const initializeJobRoutes = (app: express.Application) => {
    registerVacancies(app);
    registerFeedback(app);
};
