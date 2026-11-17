import express from 'express';
import { register as registerHhJobs } from '../modules/hh-jobs/index.js';

/** @deprecated Prefer `modules/hh-jobs.register`. */
export const initializeUtilRoutes = (app: express.Application) => {
    registerHhJobs(app);
};
