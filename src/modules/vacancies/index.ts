import type express from 'express';
import { validateVacanciesConfig } from './module.config.js';
import { registerVacancyRoutes } from './http/vacancy.routes.js';

export { VacancyController } from './http/VacancyController.js';
export {
    countSuccessfulVacancies,
    createTableVacanciesUser,
    deleteVacancyTable,
    deleteVacancyUser,
    ensureVacanciesTable,
    getVacanciesUser,
    saveVacancy,
} from './application/vacancyService.js';
export { vacanciesConfig, vacancyTableIdent } from './module.config.js';

export function register(app: express.Application): void {
    validateVacanciesConfig();
    registerVacancyRoutes(app);
}
