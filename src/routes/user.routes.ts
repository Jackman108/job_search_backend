import express from 'express';
import { initializeContactsRoutes } from './contacts.routes';
import { initializeResumeRoutes } from './resume.routes';
import { initializeSkillsRoutes } from './skills.routes';
import { initializeWorkExperienceRoutes } from './workExperience.routes';

export const initializeUserRoutes = (app: express.Application) => {
    initializeResumeRoutes(app);
    initializeContactsRoutes(app);
    initializeSkillsRoutes(app);
    initializeWorkExperienceRoutes(app);
};
