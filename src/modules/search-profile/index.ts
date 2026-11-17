import type express from 'express';
import { validateSearchProfileConfig } from './module.config.js';
import { registerSearchProfileRoutes } from './http/searchProfile.routes.js';

export { VacancyAuthController } from './http/VacancyAuthController.js';
export { VacancySubmitController } from './http/VacancySubmitController.js';
export {
    createVacancyAuth,
    deleteVacancyAuth,
    ensureVacancyAuthTable,
    getVacancyAuthByUserId,
    updateVacancyAuth,
    upsertVacancyAuthCredentials,
} from './application/vacancyAuthService.js';
export {
    createVacancySubmit,
    deleteVacancySubmit,
    ensureVacancySubmitTable,
    getVacancySubmitByUserId,
    updateVacancySubmit,
} from './application/vacancySubmitService.js';
export { searchProfileConfig } from './module.config.js';

export function register(app: express.Application): void {
    validateSearchProfileConfig();
    registerSearchProfileRoutes(app);
}
