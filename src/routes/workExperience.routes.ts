import express from 'express';
import { register as registerResume } from '../modules/resume/index.js';

/** @deprecated Prefer `modules/resume.register` (includes work experience). */
export const initializeWorkExperienceRoutes = (app: express.Application) => {
    registerResume(app);
};
