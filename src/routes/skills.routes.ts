import express from 'express';
import { register as registerResume } from '../modules/resume/index.js';

/** @deprecated Prefer `modules/resume.register` (includes skills). */
export const initializeSkillsRoutes = (app: express.Application) => {
    registerResume(app);
};
