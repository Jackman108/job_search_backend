import express from 'express';
import { register as registerResume } from '../modules/resume/index.js';

/** @deprecated Prefer `modules/resume.register`. */
export const initializeResumeRoutes = (app: express.Application) => {
    registerResume(app);
};
