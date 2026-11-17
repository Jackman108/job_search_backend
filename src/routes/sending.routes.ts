import express from 'express';
import { register as registerSearchProfile } from '../modules/search-profile/index.js';

/** @deprecated Prefer `modules/search-profile.register`. */
export const initializeVacancyRoutes = (app: express.Application) => {
    registerSearchProfile(app);
};
