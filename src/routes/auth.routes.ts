import express from 'express';
import { register as registerProfile } from '../modules/profile/index.js';

/** @deprecated Prefer `modules/profile.register`. */
export const initializeAuthRoutes = (app: express.Application) => {
    registerProfile(app);
};
