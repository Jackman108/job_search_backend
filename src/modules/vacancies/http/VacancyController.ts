import { Response } from 'express';
import { handleErrors } from '@middlewares';
import type { AuthenticatedRequest } from '../../../interface/index.js';
import { deleteVacancyTable, deleteVacancyUser, getVacanciesUser } from '../application/vacancyService.js';

export class VacancyController {
    async deleteVacanciesTable(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteVacancyTable(req.userId!);
            res.status(200).json({ message: 'Vacancy table deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy table.');
        }
    }

    async getVacancies(req: AuthenticatedRequest, res: Response) {
        try {
            const vacancies = await getVacanciesUser(req.userId!);
            res.status(200).json(vacancies);
        } catch (error) {
            handleErrors(res, error, 'Error retrieving vacancies.');
        }
    }

    async deleteVacancy(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteVacancyUser(req.userId!, req.params.vacancyId);
            res.status(200).json({ message: 'Vacancy deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy.');
        }
    }
}
